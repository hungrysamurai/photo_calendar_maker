const OUTPUT_TYPE = 'image/jpeg';

/**
 * Downscale image to fit given bounds and normalise it to JPEG - PDF export embeds stored
 * bytes as-is, so every stored image must be one format. Already-fitting JPEGs pass through
 * untouched.
 */
export default function checkAndShrinkImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<Blob | void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      const fits = width <= maxWidth && height <= maxHeight;

      if (fits && file.type === OUTPUT_TYPE) {
        resolve(file);
        return;
      }

      if (!fits) {
        const scale = Math.min(maxWidth / width, maxHeight / height);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // JPEG has no alpha - transparent PNG areas would otherwise turn black
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        resolve(blob);
      }, OUTPUT_TYPE);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
