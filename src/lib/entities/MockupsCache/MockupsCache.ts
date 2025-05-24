import WorkerPool from "./WorkerPool/WorkerPool";

export default class MockupsCache extends EventTarget {

 private mockupsCache: Blob[] = [];

 private cachingWorkersPool = new WorkerPool();

 private cachingsInProgress: number = 0;
 private mockupsCacheState: "idle" | "work" = "idle";

 constructor() {
  super();

  ["workStart", "workDone"].forEach((event) => {
   this.cachingWorkersPool.addEventListener(event, (e) => {
    this.dispatchOnStateChange(e.type as MockupCacheEventType);
   });
  });
 }

 public get state() {
  return this.mockupsCacheState
 }

 private set state(targetState) {
  this.mockupsCacheState = targetState;
 }

 public get cachedMockups() {
  return this.mockupsCache;
 }

 private dispatchOnStateChange(eventType: MockupCacheEventType) {

  this.dispatchEvent(
   new CustomEvent(eventType)
  );
 }

 public async cacheMockup(
  mockupToCache: SVGElement,
  index = 0,
  width: number,
  heigth: number
 ) {
  // Try Workers
  try {
   await this.cacheWithWorkers(mockupToCache, index, width, heigth);
  } catch (err) {
   // If Worker fails use 'inner' cache via converting SVG to canvas -> canvas to jpeg blob in main thread
   this.cachingsInProgress++;

   if (this.state === "idle") {
    this.state = "work";
    this.dispatchOnStateChange("workStart");
   }

   const canvas = await this.SVGToCanvas(mockupToCache, width, heigth);
   const blob = await this.canvasToBlob(canvas);
   this.mockupsCache[index] = blob;

   this.cachingsInProgress--;

   if (this.cachingsInProgress === 0) {
    this.state = "idle";
    this.dispatchOnStateChange("workDone");
   }
  }
 }

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

  const bmp = await createImageBitmap(
   img,
   0,
   0,
   width,
   heigth,
   {
    resizeHeight: heigth,
    resizeWidth: width,
   }
  );

  this.mockupsCache[index] = await this.cachingWorkersPool.addWork({
   bmp,
  });
 }

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

 async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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
}