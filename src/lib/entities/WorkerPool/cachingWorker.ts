addEventListener('message', async (e) => {
  const { bmp } = e.data as CacheWorkerWork;

  const { width, height } = bmp;

  const offscreenCanvas = new OffscreenCanvas(width, height);
  const ctx = offscreenCanvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(bmp, 0, 0, width, height);
  }

  const blob = await offscreenCanvas.convertToBlob({ type: 'image/jpeg' });

  postMessage(blob);
});
