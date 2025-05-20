
console.log('[Worker] Initialized');

self.onmessage = async (e) => {
 const { url } = e.data;

 const response = await fetch(url);
 const blob = await response.blob();

 self.postMessage({ blob });
};