export default function saveCachedMockupIDB(mockup: Blob, id: number): void {
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open('Photo Calendar Project', 1);

  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction('current_project_cached_mockups', 'readwrite');
    const store = transaction.objectStore('current_project_cached_mockups');

    store.put({
      id: id,
      mockup,
    });

    transaction.oncomplete = function () {
      db.close();
    };
  };
}
