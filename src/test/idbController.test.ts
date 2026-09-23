import { Blob as NodeBlob } from 'node:buffer';

import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import IDBController, {
  DB_NAME,
  IMAGES_STORE,
  PROJECTS_STORE,
} from '../lib/entities/DataController/controllers/IDBController';
import { CalendarLanguage, CalendarType, FormatName } from '../types';

type LegacyCalendarData = Omit<CalendarData, 'name' | 'createdAt' | 'lastOpenedAt'>;

const legacyData: LegacyCalendarData = {
  startYear: 2025,
  firstMonthIndex: 3,
  lang: CalendarLanguage.RU,
  font: 'Montserrat',
  format: FormatName.A3_X,
  type: CalendarType.MultiPage,
};

const projectData = (overrides: Partial<CalendarData> = {}): CalendarData => ({
  name: 'Календарь 2026 · A4 вертикальный',
  createdAt: 1000,
  lastOpenedAt: 1000,
  startYear: 2026,
  firstMonthIndex: 0,
  lang: CalendarLanguage.RU,
  font: 'Montserrat',
  format: FormatName.A4_Y,
  type: CalendarType.SinglePage,
  ...overrides,
});

// jsdom's Blob does not survive Node's structuredClone (used by fake-indexeddb),
// so stored images are built from Node's own Blob
const blob = (text: string) => new NodeBlob([text], { type: 'text/plain' }) as unknown as Blob;

const blobText = (b: Blob) => (b as unknown as NodeBlob).text();

const imageById = (images: StoredImage[], id: number) =>
  images.find((image) => image.id === id) as StoredImage;

function seedV1Database(data: LegacyCalendarData, images: StoredImage[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('current_project_data', { keyPath: 'id' });
      db.createObjectStore('current_project_images', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
      tx.objectStore('current_project_data').put({ id: 0, ...data });
      images.forEach((image) => tx.objectStore('current_project_images').put(image));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };

    request.onerror = () => reject(request.error);
  });
}

function openRaw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe('IDBController', () => {
  let controller: IDBController;

  beforeEach(() => {
    // Fresh, empty database for every test
    vi.stubGlobal('indexedDB', new IDBFactory());
    controller = new IDBController();
  });

  describe('v1 → v2 migration', () => {
    it('migrates the single v1 project and its images into the new stores', async () => {
      const before = Date.now();
      await seedV1Database(legacyData, [
        { id: 0, image: blob('jan') },
        { id: 5, image: blob('jun') },
      ]);

      const projects = await controller.listProjects();

      expect(projects).toHaveLength(1);
      const [project] = projects;
      expect(project).toMatchObject({ ...legacyData, name: 'Календарь 2025 · A3 горизонтальный' });
      expect(typeof project.id).toBe('number');
      expect(project.createdAt).toBeGreaterThanOrEqual(before);
      expect(project.lastOpenedAt).toBe(project.createdAt);

      const images = await controller.getProjectImages(project.id);
      expect(images.map((image) => image.id).sort()).toEqual([0, 5]);
      expect(await blobText(imageById(images, 5).image)).toBe('jun');
    });

    it('drops the old stores and keeps the new ones', async () => {
      await seedV1Database(legacyData, []);

      await controller.listProjects();

      const db = await openRaw();
      const stores = Array.from(db.objectStoreNames);
      db.close();

      expect(db.version).toBe(2);
      expect(stores.sort()).toEqual([IMAGES_STORE, PROJECTS_STORE]);
    });

    it('creates an empty v2 database when there is no v1 data', async () => {
      expect(await controller.listProjects()).toEqual([]);
    });
  });

  describe('projects', () => {
    it('creates, gets and lists projects', async () => {
      const id = await controller.createProject(projectData());

      expect(typeof id).toBe('number');
      expect(await controller.getProject(id)).toEqual({ ...projectData(), id });
      expect(await controller.listProjects()).toEqual([{ ...projectData(), id }]);
    });

    it('returns undefined for an unknown project id', async () => {
      expect(await controller.getProject(999)).toBeUndefined();
    });

    it('lists projects most recently opened first', async () => {
      const older = await controller.createProject(projectData({ lastOpenedAt: 100 }));
      const newest = await controller.createProject(projectData({ lastOpenedAt: 300 }));
      const middle = await controller.createProject(projectData({ lastOpenedAt: 200 }));

      const ids = (await controller.listProjects()).map((project) => project.id);

      expect(ids).toEqual([newest, middle, older]);
    });

    it('touchProject bumps lastOpenedAt', async () => {
      const id = await controller.createProject(projectData({ lastOpenedAt: 100 }));

      await controller.touchProject(id, 500);

      expect((await controller.getProject(id))?.lastOpenedAt).toBe(500);
    });

    it('updateProject changes settings, keeps createdAt and bumps lastOpenedAt', async () => {
      const id = await controller.createProject(projectData({ createdAt: 100, lastOpenedAt: 100 }));
      const patch = {
        name: 'Новое имя',
        startYear: 2030,
        firstMonthIndex: 0,
        lang: CalendarLanguage.EN,
        font: 'Caveat',
      };

      const updated = await controller.updateProject(id, patch, 700);

      const expected = { ...projectData(), ...patch, id, createdAt: 100, lastOpenedAt: 700 };
      expect(updated).toEqual(expected);
      expect(await controller.getProject(id)).toEqual(expected);
    });

    it('updateProject leaves the project images alone', async () => {
      const id = await controller.createProject(projectData({ type: CalendarType.MultiPage }));
      await controller.saveImage(id, 0, blob('jan'));
      await controller.saveImage(id, 7, blob('aug'));

      await controller.updateProject(id, { name: 'Другое', startYear: 2031 });

      const images = await controller.getProjectImages(id);
      expect(images.map((image) => image.id).sort()).toEqual([0, 7]);
      expect(await blobText(imageById(images, 7).image)).toBe('aug');
    });

    it('updateProject rejects for an unknown project id', async () => {
      await expect(controller.updateProject(999, { name: 'X' })).rejects.toThrow();
    });

    it('deletes a project', async () => {
      const id = await controller.createProject(projectData());
      const other = await controller.createProject(projectData({ name: 'Другой' }));

      await controller.deleteProject(id);

      expect(await controller.getProject(id)).toBeUndefined();
      expect((await controller.listProjects()).map((project) => project.id)).toEqual([other]);
    });
  });

  describe('images', () => {
    it('saves images per project and month index, replacing by month', async () => {
      const a = await controller.createProject(projectData());
      const b = await controller.createProject(projectData());

      await controller.saveImage(a, 0, blob('a-jan'));
      await controller.saveImage(a, 2, blob('a-mar'));
      await controller.saveImage(b, 0, blob('b-jan'));
      await controller.saveImage(a, 0, blob('a-jan-v2'));

      const imagesA = await controller.getProjectImages(a);
      const imagesB = await controller.getProjectImages(b);

      expect(imagesA.map((image) => image.id).sort()).toEqual([0, 2]);
      expect(await blobText(imageById(imagesA, 0).image)).toBe('a-jan-v2');
      expect(imagesB.map((image) => image.id)).toEqual([0]);
      expect(await blobText(imageById(imagesB, 0).image)).toBe('b-jan');
    });

    it('range-deletes a project images on project delete, leaving others intact', async () => {
      const a = await controller.createProject(projectData());
      const b = await controller.createProject(projectData());
      await controller.saveImage(a, 0, blob('a-jan'));
      await controller.saveImage(a, 11, blob('a-dec'));
      await controller.saveImage(b, 0, blob('b-jan'));

      await controller.deleteProject(a);

      expect(await controller.getProjectImages(a)).toEqual([]);
      expect((await controller.getProjectImages(b)).map((image) => image.id)).toEqual([0]);
    });
  });
});
