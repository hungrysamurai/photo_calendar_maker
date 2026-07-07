export interface CachedOutline {
  d: string;
  xShift: number;
  yShift: number;
}

type FontWeight = 'bold' | 'regular';

export default class OutlineCache {
  private cache = new Map<string, CachedOutline>();

  constructor(private font: FontData) {}

  get(text: string, size: number, weight: FontWeight = 'bold'): CachedOutline {
    const key = `${weight}:${size}:${text}`;

    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    const path = this.font[weight].getPath(text, 0, 0, size);

    const { x1, x2, y1, y2 } = path.getBoundingBox();

    const outline: CachedOutline = {
      d: path.toPathData(2),
      xShift: Number(((x2 - x1) / 2).toFixed(2)),
      yShift: Number(((y2 - y1) / 2).toFixed(2)),
    };

    this.cache.set(key, outline);

    return outline;
  }

  clear() {
    this.cache.clear();
  }
}
