import opentype from 'opentype.js';
import fontsData from '../../../assets/sourceFontsData';

export default class DataStore {
  fonts: LoadedFontsObject = {};

  calendarProjectData?: CalendarData;
  calendarImagesData: ImageObject[] = [];
  calendarCachedMockupsData: CachedMockupObject[] = [];

  constructor() {}

  public async loadFonts(): Promise<void> {
    for (const [fontTitle, fontVariants] of Object.entries(fontsData)) {
      const { fontNameBold, fontNameRegular } = fontVariants;

      const fontBoldBuffer = await fetch(`${import.meta.env.BASE_URL}${fontNameBold}.ttf`);
      const fontMeiumBuffer = await fetch(`${import.meta.env.BASE_URL}${fontNameRegular}.ttf`);

      const fonts = await Promise.all(
        [fontBoldBuffer, fontMeiumBuffer].map(async (res) => {
          const buffer = res.arrayBuffer();
          return opentype.parse(await buffer);
        }),
      );

      this.fonts[fontTitle] = fonts;
    }
  }

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

  private openDB(): Promise<IDBDatabase> {
    const request = this.getIDB();

    request.onupgradeneeded = () => {
      const db = request.result;

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

  public async initIDB(): Promise<void> {
    const db = await this.openDB();

    try {
      const tx = db.transaction(db.objectStoreNames, 'readonly');

      const [data, images, cachedMockups] = await Promise.all([
        this.promisifyRequest(tx.objectStore('current_project_data').get(0)),
        this.promisifyRequest(tx.objectStore('current_project_images').getAll()),
        this.promisifyRequest(tx.objectStore('current_project_cached_mockups').getAll()),
      ]);

      if (data) {
        this.calendarProjectData = data;
      }

      this.calendarImagesData = images;
      this.calendarCachedMockupsData = cachedMockups;

      await this.transactionComplete(tx);
    } finally {
      db.close();
    }
  }
}
