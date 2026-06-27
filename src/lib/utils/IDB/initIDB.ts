/**
 * @property {Function} initIDB - if some data in IndexedDB - retrieve project. If not - set up IDB schema for project
 */
export default function initIDB(initProject: InitProjectFn): void {
  // Open IDB
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open('Photo Calendar Project', 1);

  // Initially set DB (if there is no IDB yet)
  request.onupgradeneeded = function () {
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
  };

  request.onsuccess = function () {
    // Check if there any data in DB
    const db = request.result;

    // Init transaction on all stored objects
    const transaction = db.transaction(db.objectStoreNames, 'readonly');

    const dataStore = transaction.objectStore('current_project_data');
    const imagesStore = transaction.objectStore('current_project_images');
    // Get data object
    const dataQuery = dataStore.get(0);
    const imagesQuery = imagesStore.getAll();

    let projectData: CalendarData;
    let imagesData: ImageObject[];

    dataQuery.onsuccess = function () {
      // If data...
      if (dataQuery.result) {
        projectData = dataQuery.result;
      }
    };

    // If images...
    imagesQuery.onsuccess = function () {
      imagesData = imagesQuery.result;
    };

    transaction.oncomplete = async function () {
      if (projectData) {
        await initProject(projectData, imagesData);
      }
      db.close();
    };
  };
}
