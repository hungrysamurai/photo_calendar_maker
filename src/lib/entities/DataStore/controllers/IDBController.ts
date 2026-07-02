export default class IDBController {
  private getIDB() {
    // Open IDB
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB;

    return indexedDB.open('Photo Calendar Project', 1);
  }

  private createIDBSchema(db: IDBDatabase) {
    // Set data object
    const dataStore = db.createObjectStore('current_project_data', {
      keyPath: 'id',
    });

    dataStore.createIndex('firstMonthIndex', ['firstMonthIndex'], {
      unique: false,
    });
    dataStore.createIndex('startYear', ['startYear'], { unique: false });
    dataStore.createIndex('lang', ['lang'], { unique: false });
    dataStore.createIndex('type', ['type'], { unique: false });
    dataStore.createIndex('font', ['font'], { unique: false });
    dataStore.createIndex('format', ['format'], { unique: false });

    // Set images object
    const imagesStore = db.createObjectStore('current_project_images', {
      keyPath: 'id',
      autoIncrement: true,
    });

    imagesStore.createIndex('images', ['images'], {
      unique: false,
    });

    const cachedMockupsStore = db.createObjectStore('current_project_cached_mockups', {
      keyPath: 'id',
      autoIncrement: true,
    });

    cachedMockupsStore.createIndex('cachedMockups', ['cachedMockups'], {
      unique: false,
    });
  }

  private openDB(): Promise<IDBDatabase> {
    const request = this.getIDB();

    request.onupgradeneeded = () => {
      this.createIDBSchema(request.result);
    };

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
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

  async initIDB(): Promise<void | {
    data: CalendarData;
    images: ImageObject[];
    cachedMockups: CachedMockupObject[];
  }> {
    const db = await this.openDB();

    try {
      const tx = db.transaction(db.objectStoreNames, 'readonly');

      const [data, images, cachedMockups] = await Promise.all([
        this.promisifyRequest<CalendarData | undefined>(
          tx.objectStore('current_project_data').get(0),
        ),
        this.promisifyRequest<ImageObject[]>(tx.objectStore('current_project_images').getAll()),
        this.promisifyRequest<CachedMockupObject[]>(
          tx.objectStore('current_project_cached_mockups').getAll(),
        ),
      ]);

      await this.transactionComplete(tx);

      if (data) {
        return { data, images, cachedMockups };
      }
    } finally {
      db.close();
    }
  }

  async resetWithNewData(newData: CalendarData) {
    const db = await this.openDB();
    try {
      const tx = db.transaction(db.objectStoreNames, 'readwrite');

      await Promise.all([
        this.promisifyRequest(tx.objectStore('current_project_data').put({ id: 0, ...newData })),
        this.promisifyRequest(tx.objectStore('current_project_images').clear()),
        this.promisifyRequest(tx.objectStore('current_project_cached_mockups').clear()),
      ]);

      await this.transactionComplete(tx);
    } finally {
      db.close();
    }
  }
}
