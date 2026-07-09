import canvasToBlob from './canvasToBlob';

export default async function SVGToCanvasBlob(svg: SVGElement, width: number, heigth: number) {
  const canvas = await SVGToCanvas(svg, width, heigth);
  return canvasToBlob(canvas);
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
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  canvas.width = width;
  canvas.height = height;

  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

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
