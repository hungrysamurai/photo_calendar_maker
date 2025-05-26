import WorkerPool from "./WorkerPool/WorkerPool";
import CachingWorker from "./WorkerPool/cachingWorker?worker&url";
/**
 * MockupsCache manages caching of SVG-based mockups as image blobs. Uses WorkerPool to offload caching tasks to workers when possible. Falls back to main thread rendering if workers fail.
 */
export default class MockupsCache extends EventTarget {
  private mockupsCache: Blob[] = [];

  private cachingWorkersPool = new WorkerPool<CacheWorkerWork, Blob>(
    CachingWorker
  );

  private cachingsInProgress: number = 0;
  private mockupsCacheState: "idle" | "work" = "idle";

  constructor() {
    super();
  }

  /**
   * Returns the current caching state of the system.
   */
  public get state() {
    return this.mockupsCacheState;
  }

  private set state(targetState) {
    this.mockupsCacheState = targetState;
  }

  /**
   * Returns all cached mockups as an array of Blobs.
   */
  public get cachedMockups() {
    return this.mockupsCache;
  }

  /**
   * Dispatches a custom event reflecting the current cache state.
   *
   * @param {MockupCacheEventType} eventType - The type of state event ("workStart" | "workDone").
   */
  private dispatchOnStateChange(eventType: MockupCacheEventType) {
    this.dispatchEvent(new CustomEvent(eventType));
  }

  /**
   * Caches a single mockup, using workers if available,
   * otherwise rendering it on the main thread.
   *
   * @param {SVGElement} mockupToCache - The SVG mockup element.
   * @param {number} index - Index in the cache to store the result.
   * @param {number} width - Target width of the output image.
   * @param {number} heigth - Target height of the output image.
   */
  public async cacheMockup(
    mockupToCache: SVGElement,
    index = 0,
    width: number,
    heigth: number
  ) {
    this.cachingsInProgress++;
    if (this.state === "idle") {
      this.state = "work";
      this.dispatchOnStateChange("workStart");
    }

    try {
      await this.cacheWithWorkers(mockupToCache, index, width, heigth);
      this.cachingsInProgress--;
    } catch (err) {
      const canvas = await this.SVGToCanvas(mockupToCache, width, heigth);
      const blob = await this.canvasToBlob(canvas);
      this.mockupsCache[index] = blob;

      this.cachingsInProgress--;
    }
    if (this.cachingsInProgress === 0) {
      this.state = "idle";
      this.dispatchOnStateChange("workDone");
    };
  }

  /**
   * Attempts to cache the mockup using the WorkerPool.
   *
   * @private
   * @param {SVGElement} mockupToCache - The SVG mockup element.
   * @param {number} index - Index in the cache array.
   * @param {number} width - Width of the resulting image.
   * @param {number} heigth - Height of the resulting image.
   */
  private async cacheWithWorkers(
    mockupToCache: SVGElement,
    index = 0,
    width: number,
    heigth: number
  ) {
    const svgData = new XMLSerializer().serializeToString(mockupToCache);

    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml",
    });

    const img = new Image();
    img.src = URL.createObjectURL(svgBlob);
    await img.decode();
    URL.revokeObjectURL(img.src);

    const bmp = await createImageBitmap(img, 0, 0, width, heigth, {
      resizeHeight: heigth,
      resizeWidth: width,
    });

    this.mockupsCache[index] = await this.cachingWorkersPool.addWork({
      data: { bmp },
      transfer: [bmp],
    });
  }

  /**
   * Converts an SVG element to a canvas.
   * Used when workers fail or are unavailable.
   *
   * @private
   * @param {SVGElement} svg - The SVG element to convert.
   * @param {number} width - Desired canvas width.
   * @param {number} height - Desired canvas height.
   * @returns {Promise<HTMLCanvasElement>} - Resulting canvas element.
   */
  private async SVGToCanvas(
    svg: SVGElement,
    width: number,
    height: number
  ): Promise<HTMLCanvasElement> {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgBlobURL = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

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
        reject(new Error("Failed to load SVG image."));
      };

      img.src = svgBlobURL;
    });
  }

  /**
   * Converts a canvas to a JPEG Blob.
   *
   * @param {HTMLCanvasElement} canvas - Canvas to convert.
   * @returns {Promise<Blob>} - JPEG Blob result.
   */
  private async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to Blob."));
        }
      }, "image/jpeg");
    });
  }

  public reset() {
    this.cachingWorkersPool.dispose();
    this.mockupsCache = [];
  }
}
