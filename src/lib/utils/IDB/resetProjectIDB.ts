/**
 * @property {Function} resetProjectIDB - clear old project and set new in IDB
 * @param {Object} newCalendarData - object with data for calendar
 * @param {number} [newCalendarData.startYear]
 * @param {number} [newCalendarData.firstMonthIndex]
 * @param {string} [newCalendarData.lang]
 * @param {string} [newCalendarData.mode] - single-page/multi-page
 */
export default function resetProjectIDB({
  startYear,
  firstMonthIndex,
  lang,
  font,
  format,
  type,
}: CalendarData): void {
  // Open IDB
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open('Photo Calendar Project', 1);

  request.onsuccess = function () {
    const db = request.result;

    const transaction = db.transaction(db.objectStoreNames, 'readwrite');

    const dataStore = transaction.objectStore('current_project_data');
    const imagesStore = transaction.objectStore('current_project_images');

    // Add new data to db
    dataStore.put({
      id: 0,
      startYear,
      firstMonthIndex,
      lang,
      type,
      font,
      format,
    });

    // Remove old images
    imagesStore.clear();

    transaction.oncomplete = function () {
      db.close();
    };
  };
}
