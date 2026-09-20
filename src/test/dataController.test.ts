import { Blob as NodeBlob } from 'node:buffer';

import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DataController from '../lib/entities/DataController/DataController';
import IDBController from '../lib/entities/DataController/controllers/IDBController';
import { CalendarLanguage, CalendarType, FormatName } from '../types';

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

const blob = (text: string) => new NodeBlob([text], { type: 'text/plain' }) as unknown as Blob;
const blobText = (b: Blob) => (b as unknown as NodeBlob).text();

describe('DataController', () => {
  let idb: IDBController;
  let controller: DataController;

  beforeEach(() => {
    // Fresh, empty database for every test
    vi.stubGlobal('indexedDB', new IDBFactory());
    idb = new IDBController();
    controller = new DataController();
  });

  describe('createProject', () => {
    it('persists the project, makes it active and clears images', async () => {
      const id = await controller.createProject(projectData({ name: 'Первый' }));

      expect(controller.activeProjectId).toBe(id);
      expect(controller.calendarProjectData.name).toBe('Первый');
      expect(controller.calendarImagesData).toEqual([]);
      expect((await idb.getProject(id))?.name).toBe('Первый');
    });

    it('keeps earlier projects and their images intact', async () => {
      const first = await controller.createProject(
        projectData({ name: 'Первый', lastOpenedAt: 100 }),
      );
      await controller.saveImageToIDB(blob('jan'), 0);

      const second = await controller.createProject(
        projectData({ name: 'Второй', lastOpenedAt: 200 }),
      );

      expect(second).not.toBe(first);
      expect((await idb.listProjects()).map((project) => project.name)).toEqual([
        'Второй',
        'Первый',
      ]);
      expect((await idb.getProjectImages(first)).map((image) => image.id)).toEqual([0]);
    });
  });

  describe('saveImageToIDB', () => {
    it('writes under the active project and updates in-memory images', async () => {
      const first = await controller.createProject(projectData());
      const second = await controller.createProject(projectData());

      await controller.saveImageToIDB(blob('second-mar'), 2);
      await controller.saveImageToIDB(blob('second-mar-v2'), 2);

      expect(await idb.getProjectImages(first)).toEqual([]);
      const stored = await idb.getProjectImages(second);
      expect(stored.map((image) => image.id)).toEqual([2]);
      expect(await blobText(stored[0].image)).toBe('second-mar-v2');
      expect(controller.calendarImagesData.map((image) => image.id)).toEqual([2]);
      expect(await blobText(controller.calendarImagesData[0].image)).toBe('second-mar-v2');
    });

    it('throws when there is no active project', async () => {
      await expect(controller.saveImageToIDB(blob('x'), 0)).rejects.toThrow();
    });
  });

  describe('loadProject', () => {
    it('loads record and images, bumps lastOpenedAt and sets it active', async () => {
      const id = await idb.createProject(projectData({ name: 'Старый', lastOpenedAt: 100 }));
      await idb.saveImage(id, 4, blob('may'));
      const before = Date.now();

      await controller.loadProject(id);

      expect(controller.activeProjectId).toBe(id);
      expect(controller.calendarProjectData.name).toBe('Старый');
      expect(controller.calendarProjectData.lastOpenedAt).toBeGreaterThanOrEqual(before);
      expect(controller.calendarImagesData.map((image) => image.id)).toEqual([4]);
      expect((await idb.getProject(id))?.lastOpenedAt).toBeGreaterThanOrEqual(before);
    });

    it('throws for an unknown project id', async () => {
      await expect(controller.loadProject(42)).rejects.toThrow();
    });
  });

  describe('restoreLastOpened', () => {
    it('opens the project with the greatest lastOpenedAt', async () => {
      await idb.createProject(projectData({ name: 'Старый', lastOpenedAt: 100 }));
      const newest = await idb.createProject(projectData({ name: 'Свежий', lastOpenedAt: 300 }));
      await idb.createProject(projectData({ name: 'Средний', lastOpenedAt: 200 }));
      await idb.saveImage(newest, 1, blob('feb'));

      const restored = await controller.restoreLastOpened();

      expect(restored).toBe(true);
      expect(controller.activeProjectId).toBe(newest);
      expect(controller.calendarProjectData.name).toBe('Свежий');
      expect(controller.calendarImagesData.map((image) => image.id)).toEqual([1]);
    });

    it('returns false and stays empty when there are no projects', async () => {
      expect(await controller.restoreLastOpened()).toBe(false);
      expect(controller.activeProjectId).toBeNull();
      expect(controller.calendarProjectData).toBeUndefined();
    });
  });

  describe('deleteProject', () => {
    it('removes the project and clears state if it was active', async () => {
      const id = await controller.createProject(projectData());
      await controller.saveImageToIDB(blob('jan'), 0);

      await controller.deleteProject(id);

      expect(await idb.getProject(id)).toBeUndefined();
      expect(await idb.getProjectImages(id)).toEqual([]);
      expect(controller.activeProjectId).toBeNull();
      expect(controller.calendarProjectData).toBeUndefined();
      expect(controller.calendarImagesData).toEqual([]);
    });

    it('leaves the active project untouched when deleting another one', async () => {
      const other = await idb.createProject(projectData({ name: 'Другой' }));
      const active = await controller.createProject(projectData({ name: 'Активный' }));
      await controller.saveImageToIDB(blob('jan'), 0);

      await controller.deleteProject(other);

      expect(controller.activeProjectId).toBe(active);
      expect(controller.calendarProjectData.name).toBe('Активный');
      expect(controller.calendarImagesData.map((image) => image.id)).toEqual([0]);
    });
  });

  it('listProjects delegates to IDB ordering', async () => {
    await idb.createProject(projectData({ name: 'A', lastOpenedAt: 1 }));
    await idb.createProject(projectData({ name: 'B', lastOpenedAt: 2 }));

    expect((await controller.listProjects()).map((project) => project.name)).toEqual(['B', 'A']);
  });
});
