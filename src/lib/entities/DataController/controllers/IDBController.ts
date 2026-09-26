import getProjectName from '../../../utils/getProjectName';

export const DB_NAME = 'Photo Calendar Project';
export const DB_VERSION = 2;
export const PROJECTS_STORE = 'projects';
export const IMAGES_STORE = 'images';

// v1 (single-project) stores, kept only for the migration
const LEGACY_DATA_STORE = 'current_project_data';
const LEGACY_IMAGES_STORE = 'current_project_images';

type LegacyCalendarData = Omit<CalendarData, 'name' | 'createdAt' | 'lastOpenedAt'>;

export default class IDBController {
  private getIDB() {
    // Open IDB
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB;

    return indexedDB.open(DB_NAME, DB_VERSION);
  }

  private createIDBSchema(db: IDBDatabase) {
    const projectsStore = db.createObjectStore(PROJECTS_STORE, {
      keyPath: 'id',
      autoIncrement: true,
    });
    projectsStore.createIndex('lastOpenedAt', 'lastOpenedAt', { unique: false });

    const imagesStore = db.createObjectStore(IMAGES_STORE, {
      keyPath: ['projectId', 'monthIndex'],
    });
    imagesStore.createIndex('projectId', 'projectId', { unique: false });
  }

  /**
   * Move the single v1 project (and its images) into the v2 stores,
   * then drop the v1 stores. Runs entirely inside the upgrade transaction.
   */
  private migrateFromV1(db: IDBDatabase, tx: IDBTransaction) {
    if (!db.objectStoreNames.contains(LEGACY_DATA_STORE)) return;

    const legacyDataStore = tx.objectStore(LEGACY_DATA_STORE);
    const legacyImagesStore = tx.objectStore(LEGACY_IMAGES_STORE);
    const projectsStore = tx.objectStore(PROJECTS_STORE);
    const imagesStore = tx.objectStore(IMAGES_STORE);

    legacyDataStore.get(0).onsuccess = (event) => {
      const legacy = (event.target as IDBRequest<(LegacyCalendarData & { id: 0 }) | undefined>)
        .result;

      if (!legacy) {
        db.deleteObjectStore(LEGACY_DATA_STORE);
        db.deleteObjectStore(LEGACY_IMAGES_STORE);
        return;
      }

      const now = Date.now();
      const project: CalendarData & { id?: number } = {
        ...legacy,
        name: getProjectName(legacy.startYear, legacy.format),
        createdAt: now,
        lastOpenedAt: now,
      };
      // Let the new store assign its own auto-incremented id
      delete project.id;

      projectsStore.add(project).onsuccess = (addEvent) => {
        const projectId = (addEvent.target as IDBRequest<IDBValidKey>).result as number;

        legacyImagesStore.getAll().onsuccess = (imagesEvent) => {
          const images = (imagesEvent.target as IDBRequest<StoredImage[]>).result;

          images.forEach(({ id, image }) => {
            const record: StoredProjectImage = { projectId, monthIndex: id, image };
            imagesStore.put(record);
          });

          db.deleteObjectStore(LEGACY_DATA_STORE);
          db.deleteObjectStore(LEGACY_IMAGES_STORE);
        };
      };
    };
  }

  private openDB(): Promise<IDBDatabase> {
    const request = this.getIDB();

    request.onupgradeneeded = () => {
      const db = request.result;
      this.createIDBSchema(db);
      this.migrateFromV1(db, request.transaction as IDBTransaction);
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private transactionComplete(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Run `fn` inside a transaction over the given stores, closing the DB afterwards.
   * If `fn` fails, the transaction is aborted so none of its writes are kept.
   */
  private async withTransaction<T>(
    storeNames: string[],
    mode: IDBTransactionMode,
    fn: (tx: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    const db = await this.openDB();

    try {
      const tx = db.transaction(storeNames, mode);
      const complete = this.transactionComplete(tx);
      // Rejection is surfaced by `fn`'s own error below
      complete.catch(() => {});

      let result: T;
      try {
        result = await fn(tx);
      } catch (err) {
        try {
          tx.abort();
        } catch {
          // Already finished or aborted
        }
        throw err;
      }

      await complete;
      return result;
    } finally {
      db.close();
    }
  }

  /**
   * All projects, most recently opened first
   */
  listProjects(): Promise<StoredProject[]> {
    return this.withTransaction([PROJECTS_STORE], 'readonly', async (tx) => {
      const projects = await this.promisifyRequest<StoredProject[]>(
        tx.objectStore(PROJECTS_STORE).getAll(),
      );
      return projects.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    });
  }

  getProject(id: number): Promise<StoredProject | undefined> {
    return this.withTransaction([PROJECTS_STORE], 'readonly', (tx) =>
      this.promisifyRequest<StoredProject | undefined>(tx.objectStore(PROJECTS_STORE).get(id)),
    );
  }

  /**
   * Images of a project as in-memory `StoredImage`s (keyed by month index)
   */
  getProjectImages(projectId: number): Promise<StoredImage[]> {
    return this.withTransaction([IMAGES_STORE], 'readonly', async (tx) => {
      const records = await this.promisifyRequest<StoredProjectImage[]>(
        tx.objectStore(IMAGES_STORE).getAll(this.projectImagesRange(projectId)),
      );
      return records.map(({ monthIndex, image }) => ({ id: monthIndex, image }));
    });
  }

  /**
   * @returns id of the created project
   */
  createProject(data: CalendarData): Promise<number> {
    return this.withTransaction([PROJECTS_STORE], 'readwrite', async (tx) => {
      const key = await this.promisifyRequest(tx.objectStore(PROJECTS_STORE).add(data));
      return key as number;
    });
  }

  /**
   * Delete a project together with all of its images
   */
  deleteProject(id: number): Promise<void> {
    return this.withTransaction([PROJECTS_STORE, IMAGES_STORE], 'readwrite', async (tx) => {
      await Promise.all([
        this.promisifyRequest(tx.objectStore(PROJECTS_STORE).delete(id)),
        this.promisifyRequest(tx.objectStore(IMAGES_STORE).delete(this.projectImagesRange(id))),
      ]);
    });
  }

  saveImage(projectId: number, monthIndex: number, image: Blob): Promise<void> {
    return this.withTransaction([IMAGES_STORE], 'readwrite', async (tx) => {
      const record: StoredProjectImage = { projectId, monthIndex, image };
      await this.promisifyRequest(tx.objectStore(IMAGES_STORE).put(record));
    });
  }

  /**
   * Bump project's `lastOpenedAt`
   */
  touchProject(id: number, lastOpenedAt = Date.now()): Promise<void> {
    return this.withTransaction([PROJECTS_STORE], 'readwrite', async (tx) => {
      const store = tx.objectStore(PROJECTS_STORE);
      const project = await this.promisifyRequest<StoredProject | undefined>(store.get(id));

      if (project) {
        await this.promisifyRequest(store.put({ ...project, lastOpenedAt }));
      }
    });
  }

  /**
   * Apply edited settings to a project; `createdAt` is kept, `lastOpenedAt` is bumped.
   * With `reindexShift`, the project images move to `(monthIndex + shift) mod 12`
   * in the same transaction, so settings and images change together or not at all.
   * @returns the updated project record
   */
  updateProject(
    id: number,
    patch: Partial<EditableProjectSettings>,
    reindexShift?: number,
    lastOpenedAt = Date.now(),
  ): Promise<StoredProject> {
    return this.withTransaction([PROJECTS_STORE, IMAGES_STORE], 'readwrite', async (tx) => {
      const store = tx.objectStore(PROJECTS_STORE);
      const project = await this.promisifyRequest<StoredProject | undefined>(store.get(id));

      if (!project) {
        throw new Error(`Project ${id} not found`);
      }

      const updated: StoredProject = {
        ...project,
        ...patch,
        id,
        createdAt: project.createdAt,
        lastOpenedAt,
      };
      await this.promisifyRequest(store.put(updated));

      if (reindexShift) {
        await this.reindexImages(tx, id, reindexShift);
      }

      return updated;
    });
  }

  /**
   * Move every image of a project by `shift` pages (wrapping around the year).
   * Read all → range-delete → write back: rewriting key by key would collide
   * with images that have not been moved yet.
   */
  private async reindexImages(tx: IDBTransaction, projectId: number, shift: number) {
    const store = tx.objectStore(IMAGES_STORE);
    const range = this.projectImagesRange(projectId);

    const records = await this.promisifyRequest<StoredProjectImage[]>(store.getAll(range));
    await this.promisifyRequest(store.delete(range));

    await Promise.all(
      records.map((record) => {
        const monthIndex = (((record.monthIndex + shift) % 12) + 12) % 12;
        return this.promisifyRequest(store.add({ ...record, monthIndex }));
      }),
    );
  }

  /**
   * Key range covering every `[projectId, monthIndex]` of a project
   */
  private projectImagesRange(projectId: number): IDBKeyRange {
    return IDBKeyRange.bound([projectId, -Infinity], [projectId, Infinity]);
  }
}
