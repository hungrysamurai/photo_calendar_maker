export default function createSvgElementFromString<T extends SVGElement>(
  svgMarkup: string,
  attrs: Record<string, string> = {},
): T {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgMarkup}</svg>`,
    'image/svg+xml',
  );

  const element = doc.documentElement.firstElementChild as T | null;

  if (!element) {
    throw new Error('Invalid SVG markup');
  }

  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));

  return element;
}
