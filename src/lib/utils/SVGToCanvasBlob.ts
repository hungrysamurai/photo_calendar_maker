import canvasToBlob from './canvasToBlob';

/**
 * Safari/iOS silently refuse canvases above ~16.7 MP (A2 at 300 dpi is ~35 MP) - drawing
 * succeeds but yields a blank image. Used as fallback area when probe shows requested size
 * is unusable.
 */
const SAFE_CANVAS_AREA = 16_777_216;

export default async function SVGToCanvasBlob(svg: SVGElement, width: number, heigth: number) {
  const canvas = await SVGToCanvas(svg, width, heigth);
  return canvasToBlob(canvas);
}

/**
 * Size canvas to requested dimensions, or - when browser can't back a canvas that big -
 * to the largest same-ratio size it can. Returns the actual scale applied.
 */
function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): number {
  if (isCanvasUsable(canvas, width, height)) return 1;

  const scale = Math.sqrt(SAFE_CANVAS_AREA / (width * height));
  const fallbackWidth = Math.floor(width * scale);
  const fallbackHeight = Math.floor(height * scale);

  if (!isCanvasUsable(canvas, fallbackWidth, fallbackHeight)) {
    throw new Error(`Canvas of ${fallbackWidth}x${fallbackHeight} is not supported`);
  }

  return fallbackWidth / width;
}

/**
 * Over-limit canvas reports its size fine but every pixel reads back empty -
 * paint one in the far corner and check it stuck
 */
function isCanvasUsable(canvas: HTMLCanvasElement, width: number, height: number): boolean {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  try {
    ctx.fillStyle = '#000';
    ctx.fillRect(width - 1, height - 1, 1, 1);
    const usable = ctx.getImageData(width - 1, height - 1, 1, 1).data[3] !== 0;
    ctx.clearRect(0, 0, width, height);
    return usable;
  } catch {
    return false;
  }
}

async function SVGToCanvas(
  svg: SVGElement,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const svgBlobURL = URL.createObjectURL(svgBlob);

  const canvas = document.createElement('canvas');
  const scale = sizeCanvas(canvas, width, height);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width * scale, height * scale);

      URL.revokeObjectURL(svgBlobURL);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgBlobURL);
      reject(new Error('Failed to load SVG image.'));
    };

    img.src = svgBlobURL;
  });
}
