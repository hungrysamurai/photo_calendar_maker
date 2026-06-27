/**
 * @property {Function} saveImageIDB - save current image to IndexedDB
 * @param {string} imageFile - image to save in IndexedDB
 * @param {number} id - index of month
 */
export default function saveImageIDB(imageFile: string, id: number): void {
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open('Photo Calendar Project', 1);

  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction('current_project_images', 'readwrite');
    const store = transaction.objectStore('current_project_images');

    store.put({
      id: id,
      image: imageFile,
    });

    transaction.oncomplete = function () {
      db.close();
    };
  };
}
