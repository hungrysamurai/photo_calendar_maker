export default function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob'));
        }
      },
      type,
      quality,
    );
  });
}
