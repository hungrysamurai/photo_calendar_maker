import Cropper from "cropperjs";

import { getMonthsList } from "./utils/getMonthsList";
import { createHTMLElement } from "./utils/createElement/createHTMLElement";

import WorkerPool from "./entities/MockupsCache/WorkerPool/WorkerPool";

/**
 * Object with SVG icons
 */
import { icons } from "../assets/icons";
import { A_outputFormats } from "../assets/A_FormatOptions/A_OutputDimensions";

import {
  FormatName,
  CalendarType,
  CalendarLanguage,
  LoadingState,
  PDFPagesRangeToDownload,
  FontSubfamily,
} from "../../types";
import { createSVGElement } from "./utils/createElement/createSVGElement";
import MockupsCache from "./entities/MockupsCache/MockupsCache";

/**
 * Class that includes basic logic of calendar grid creation, methods to init basic DOM elements, upload/download documents (single), caching mockups, Cropper functionality, image compression, saving to IndexedDB (single) and loader
 */
export abstract class Calendar {
  static _currentCalendar: Calendar;

  static get current(): Calendar {
    return Calendar._currentCalendar;
  }

  static set current(calendar: Calendar) {
    Calendar._currentCalendar = calendar;
  }

  static loadingScreen: HTMLDivElement;
  /**
   * @property {Fucntion} createLoader - creates loader element
   */
  static createLoader(element: HTMLElement): void {
    Calendar.loadingScreen = createHTMLElement({
      elementName: "div",
      className: "loading-screen hide",
      content: icons.loader,
      insertTo: {
        element,
        position: "beforebegin",
      },
    });
  }

  /**
   * @property {Fucntion} loading - toggle visibility of loader element
   * @param {string} targetState - turn loader to
   * @returns {void}
   */
  static loading(targetState: LoadingState): void {
    if (Calendar.current) {
      if (targetState === LoadingState.Hide) {
        this.loadingScreen.classList.add("hide");
        Calendar.current.controlsContainer.style.pointerEvents = "auto";
      } else if (targetState === LoadingState.Show) {
        this.loadingScreen.classList.remove("hide");
        Calendar.current.controlsContainer.style.pointerEvents = "none";
      }
    }
  }

  static cleanUp(controlsContainer: HTMLDivElement): void {
    Calendar.current.parentContainer.innerHTML = "";

    // Clean controls to default if new type
    if (Calendar.isNewType) {
      [...controlsContainer.children].forEach((el) => {
        if (!this.basicControls.includes(el as HTMLElement)) {
          el.remove();
        }
      });
    }
  }

  static isNewType: boolean = true;

  static mockupsCache: Blob[] = [];
  static cachingWorkersPool = new WorkerPool();

  static mockupsCachingState: "idle" | "work" = "idle";
  static cachingsInProgress: number = 0;

  cache = new MockupsCache()

  /**
   * Dimensions of document (px)
   */
  static outputDimensions: OutputDimensions = A_outputFormats;

  static currentPDFDownloadBtn: HTMLButtonElement;
  static jpgDownloadBtn: HTMLButtonElement;
  static cropBtn: HTMLButtonElement;
  static uploadImgInput: HTMLInputElement;
  static uploadImgBtn: HTMLLabelElement;

  static basicControls: HTMLElement[] = [];

  static cropperOuter: HTMLDivElement;
  static cropper: Cropper | undefined;
  static imageToCrop: SVGImageElement;
  static tempCropImageElement: HTMLImageElement;
  static applyCropBtn: HTMLButtonElement;
  static cancelCropBtn: HTMLButtonElement;

  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

  // Set fonts object
  fonts: FontData = {};

  currentMonth: number = 0;
  monthsNamesList: ReturnType<typeof getMonthsList>;
  monthCounter: number;
  firstMonth: number;

  // Rate to reduce uploading images size
  imageReduceSizeRate: number = 11.8;
  startYear: number;
  lastMonth: number;
  endYear: number;

  mockupHeight: number;
  mockupWidth: number;

  imagePlaceholderWidth: number;
  imagePlaceholderHeight: number;
  imagePlaceholderX: number;
  imagePlaceholderY: number;

  dayCellHeight: number;
  dayCellWidth: number;
  calendarGridX: number;
  calendarGridY: number;
  daysFontSize: number;

  calendarGridLeftIndent: number;
  calendarGridTopIndent: number;

  calendarInner: HTMLDivElement;
  calendarWrapper: HTMLDivElement;
  imageElementGroup: SVGGElement;

  weekDaysNamesList: string[];

  constructor(
    public firstMonthIndex: number,
    public year: number,
    public parentContainer: HTMLDivElement,
    public controlsContainer: HTMLDivElement,
    public cropControlsContainer: HTMLDivElement,
    public lang: CalendarLanguage,
    public type: CalendarType,
    public currentFont: FontArray,
    public format: FormatName
  ) {
    // Add subfamilies to fonts object
    for (let i = 0; i < currentFont.length; i++) {
      this.fonts[
        currentFont[i]?.names?.fontSubfamily.en.toLowerCase() as FontSubfamily
      ] = currentFont[i];
    }
    this.monthsNamesList = getMonthsList(this.lang);
    /**
     * Counter of months
     */
    this.monthCounter = this.firstMonthIndex;

    /**
     * Capture initial first month & year
     */
    this.firstMonth = this.firstMonthIndex;
    this.startYear = this.year;

    if (!Calendar.current) {
      // First initialization
      Calendar.createLoader(parentContainer);
      Calendar.initBasicControls(controlsContainer);
      Calendar.initBasicControlsEvents();

      Calendar.initCropperControls(cropControlsContainer);

      ["workStart", "workDone"].forEach((event) => {
        Calendar.cachingWorkersPool.addEventListener(event, (e) => {
          Calendar.mockupsCachingState = e.detail.state;
        });
      });

      ["workStart", "workDone"].forEach((event) => {
        this.cache.addEventListener(event, (e) => {
          console.log(e.type);
        });
      });
    } else {
      // Check new type vs old type
      Calendar.isNewType = type !== Calendar.current.type;

      // Clean  mockup container
      Calendar.cleanUp(controlsContainer);
    }

    // Clear cache of mockups
    Calendar.mockupsCache = [];

    Calendar.current = this;
  }

  /**
   * @property {Function} initBasicControls - creates controls buttons in DOM
   */
  static initBasicControls(controlsContainer: HTMLDivElement): void {
    controlsContainer.innerHTML = "";

    this.currentPDFDownloadBtn = createHTMLElement({
      elementName: "button",
      parentToAppend: controlsContainer,
      id: "pdf-download-current",
      content: icons.pdfSingle,
    });

    this.basicControls.push(this.currentPDFDownloadBtn);

    this.jpgDownloadBtn = createHTMLElement({
      elementName: "button",
      parentToAppend: controlsContainer,
      id: "jpg-download",
      content: icons.jpg,
    });

    this.basicControls.push(this.jpgDownloadBtn);

    this.cropBtn = createHTMLElement({
      elementName: "button",
      id: "crop-btn",
      content: icons.crop,
      parentToAppend: controlsContainer,
    });

    this.basicControls.push(this.cropBtn);

    this.uploadImgInput = createHTMLElement({
      elementName: "input",
      id: "upload-input",
      parentToAppend: controlsContainer,
      attributes: {
        type: "file",
        accept: "image/jpeg, image/png, image/jpg",
        hidden: new Boolean(true).toString(),
        onclick: "this.value=null;",
      },
    });

    this.basicControls.push(this.uploadImgInput);

    this.uploadImgBtn = createHTMLElement({
      elementName: "label",
      id: "upload-btn",
      content: icons.upload,
      className: "upload-btn",
      parentToAppend: controlsContainer,
      attributes: {
        for: "upload-input",
      },
    });

    this.basicControls.push(this.uploadImgBtn);
  }

  /**
   * @property {Function} initBasicControlsEvents - sets events on buttons
   */
  static initBasicControlsEvents(): void {
    this.currentPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF(PDFPagesRangeToDownload.Current);
    });

    this.jpgDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadCurrentJPG();
    });

    this.cropBtn.addEventListener("click", () => {
      if (this.cropper) return;

      const currentImageElement = this.getCurrentMockup("image");

      if (currentImageElement) {
        Calendar.loading(LoadingState.Show);

        this.imageToCrop = currentImageElement as SVGImageElement;
        this.initCropper();
        this.current.cropControlsContainer.classList.remove("hide");
      }
    });

    this.uploadImgInput.addEventListener("input", (e) => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.uploadImg(e);
    });
  }

  // Upload/download section

  /**
   * @async
   * @property {Function} uploadImg - Upload single image
   * @param {e} e - Event object that fires when upload single image button pressed
   */
  static async uploadImg(e: Event) {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const imageFile = e.target.files[0];
      const reader = new FileReader();

      Calendar.loading(LoadingState.Show);

      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const imageGroup = this.getCurrentMockup("#image-group");
        imageGroup.innerHTML = "";

        const imageEl = createSVGElement({
          elementName: "image",
          attributes: {
            height:
              this.current.mockupOptions.imagePlaceholderHeight.toString(),
            width: this.current.mockupOptions.imagePlaceholderWidth.toString(),
            x: this.current.mockupOptions.imagePlaceholderX.toString(),
            y: this.current.mockupOptions.imagePlaceholderY.toString(),
          },
          parentToAppend: imageGroup,
        });

        // Image optimization
        const reduced = await this.reduceImageSize(
          reader.result as string,
          this.current.mockupOptions.imagePlaceholderWidth *
          this.current.imageReduceSizeRate,
          this.current.mockupOptions.imagePlaceholderHeight *
          this.current.imageReduceSizeRate
        );

        const resultImage = reduced ? reduced : reader.result;
        imageEl.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          resultImage as string
        );

        // Save image to IDB
        this.current.saveToIDB(resultImage as string);

        // Cache mockup after change
        Calendar.cacheMockup(
          this.getCurrentMockup("svg") as SVGElement,
          this.current.currentMonth
        );


        this.current.cache.cacheMockup(
          Calendar.getMockupByIndex(0),
          0,
          Calendar.outputDimensions[this.current.format].width,
          Calendar.outputDimensions[this.current.format].height
        )


        Calendar.loading(LoadingState.Hide);
      };
    }
  }

  /**
   * @async
   * @property {Function} reduceImageSize - Reduce image file size & resolution
   * @param {string} base64Str - Base64 string - image file
   * @param {number} maxWidth - max width of image is equal to width of svg-placeholder times imageReduceSizeRate
   * @param {number} maxHeight - max height of image is equal to height of svg-placeholder times imageReduceSizeRate
   */
  static async reduceImageSize(
    base64Str: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<void | string> {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width <= maxWidth && height <= maxHeight) {
          // If resolution of image is less than actual placeholder size
          resolve();
        }
        let canvas = document.createElement("canvas");
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0, width, height);
        // Return reduced image
        resolve(canvas.toDataURL("image/png"));
      };
    });
  }

  /**
   * @async
   * @property {Function} downloadCurrentJPG - Download current (visible) svg mockup
   */
  static async downloadCurrentJPG(): Promise<void> {
    const url = URL.createObjectURL(
      Calendar.mockupsCache[this.current.currentMonth]
    );
    const fileName = this.getFileName();

    this.downloadElement(url, fileName);
  }

  /**
   * @async
   * @property {Function} downloadPDF - download as PDF
   * @param {string} range - single-page/all pages
   */
  static async downloadPDF(range: PDFPagesRangeToDownload): Promise<void> {
    Calendar.loading(LoadingState.Show);
    const { PDFDocument } = await import("pdf-lib");
    const pdf = await PDFDocument.create();

    const pagesToDownload =
      range === PDFPagesRangeToDownload.All
        ? this.mockupsCache
        : [this.mockupsCache[this.current.currentMonth]];

    for (const blob of pagesToDownload) {
      const arrayBuffer = await blob.arrayBuffer();

      const image = await pdf.embedJpg(arrayBuffer);
      const page = pdf.addPage([
        this.outputDimensions[this.current.format].width,
        this.outputDimensions[this.current.format].height,
      ]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: this.outputDimensions[this.current.format].width,
        height: this.outputDimensions[this.current.format].height,
      });
    }

    const arrayBuffer = await pdf.save();

    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    const blobURL = URL.createObjectURL(blob);

    const fileName = this.getFileName(range === PDFPagesRangeToDownload.All);

    this.downloadElement(blobURL, fileName);

    Calendar.loading(LoadingState.Hide);
    URL.revokeObjectURL(blobURL);
  }

  /**
   * @property {Fucntion} downloadElement - create link element, download object, destroy link element
   * @param {string} elementURL - URL of blob or canvas to download
   * @param {string} fileName
   */
  private static downloadElement(elementURL: string, fileName: string): void {
    const a = document.createElement("a");
    a.download = fileName;
    a.href = elementURL;
    a.click();
    a.remove();
  }

  /**
   * @property {Function} getFileName - Generates name of file
   * @param {boolean} span
   */
  static getFileName(span?: boolean): string {
    if (span || this.current.type === CalendarType.SinglePage) {
      const firstMonth = this.current.firstMonth;
      const firstMonthYear = this.current.startYear;

      const date1 = new Date(Number(firstMonthYear), Number(firstMonth));
      const firstMonthName = date1.toLocaleString("default", { month: "long" });

      const lastMonth = this.current.lastMonth;
      const lastMonthYear = this.current.endYear;

      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString("default", {
        month: "long",
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear}`;
    }

    const currentMonthContainer = Calendar.getCurrentMockup();

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(Number(year), Number(month));
    const monthName = date.toLocaleString("default", { month: "long" });

    return `${monthName}_${year}`;
  }

  // Caching

  /**
   * @async
   * @property {Fucntion} cacheMockup - cache newly generated SVG as jpeg Blob. Trying to use Workers
   * @param mockupToCache
   * @param index
   */
  static async cacheMockup(mockupToCache: SVGElement, index = 0) {
    // Try Workers
    try {
      // throw new Error();
      await this.cacheSVG(mockupToCache, index);

      console.log(this.mockupsCachingState);
      // this.mockupsCachingState = this.cachingWorkersPool.currentState;
    } catch (err) {
      // If Worker fails use 'inner' cache via converting SVG to canvas -> canvas to jpeg blob in main thread
      this.cachingsInProgress++;

      if (this.mockupsCachingState === "idle") {
        this.mockupsCachingState = "work";
      }

      const canvas = await this.SVGToCanvas(mockupToCache);
      const blob = await this.canvasToBlob(canvas);
      this.mockupsCache[index] = blob;

      this.cachingsInProgress--;

      if (this.cachingsInProgress === 0) {
        this.mockupsCachingState = "idle";
      }
    }
  }

  /**
   * @async
   * @property {Fucntion} cacheSVG - convert SVG to ImageBitmap -> add bmp to WorkerPool -> in WorkerPool draw bmt on offscreenCanvas, convert to jpeg Blob -> add blob to cache array
   * @param mockupToCache
   * @param index
   */
  static async cacheSVG(mockupToCache: SVGElement, index = 0) {
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
      this.outputDimensions[this.current.format].width,
      this.outputDimensions[this.current.format].height,
      {
        resizeHeight: this.outputDimensions[this.current.format].height,
        resizeWidth: this.outputDimensions[this.current.format].width,
      }
    );

    this.mockupsCache[index] = await this.cachingWorkersPool.addWork({
      bmp,
    });
  }

  /**
   * @async
   * @property {Function} SVGToCanvas - convert given SVG to Canvas
   * @param {SVGElement} svg
   */
  static async SVGToCanvas(svg: SVGElement): Promise<HTMLCanvasElement> {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgBlobURL = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = this.outputDimensions[this.current.format].width;
    canvas.height = this.outputDimensions[this.current.format].height;

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
   * @async
   * @property {Function} canvasToBlob - create blob object from given canvas
   * @param canvas
   * @returns
   */
  static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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

  // Crop functionality section

  /**
   * @property {Function} initCropper - create Cropper object, initCropper on current svg mockup image element
   */
  static initCropper(): void {
    const imageFile = this.imageToCrop.getAttribute("href") as string;

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        // Position cropper element on top of placeholder
        this.updateCropperPosition();

        this.tempCropImageElement = createHTMLElement({
          elementName: "img",
          className: "image-element",
          parentToAppend: this.cropperOuter,
          attributes: {
            src: URL.createObjectURL(imageFile),
          },
        });

        this.imageToCrop.style.visibility = "hidden";

        this.cropper = new Cropper(this.tempCropImageElement, {
          viewMode: 0,
          dragMode: "none",
          modal: false,
          background: false,
          autoCropArea: 1,
          ready: () => {
            if (this.cropper) {
              this.cropper.initialZoomRatio =
                this.cropper.getCanvasData().width /
                this.cropper.getCanvasData().naturalWidth;
            }

            window.onresize = () => {
              this.updateCropperPosition();
            };
            Calendar.loading(LoadingState.Hide);
          },

          zoom: (e) => {
            if (this.cropper) {
              this.cropper.crop();
              this.cropper.setAspectRatio(0);

              this.cropper.setCropBoxData({
                width: this.cropper.getContainerData().width,
                height: this.cropper.getContainerData().height,
              });

              if (e.detail.ratio < e.detail.oldRatio) {
                if (
                  this.cropper.getCanvasData().width - 10 <
                  this.cropper.initialCanvasData.width
                ) {
                  this.cropper.reset();
                }
              }

              this.cropper.zoomRatio =
                this.cropper.getCanvasData().width /
                this.cropper.getCanvasData().naturalWidth;

              if (
                this.cropper.zoomRatio.toFixed(5) >
                this.cropper.initialZoomRatio.toFixed(5)
              ) {
                this.cropper.setDragMode("move");
                this.cropper.options.viewMode = 3;
              } else {
                this.cropper.setDragMode("none");
                this.cropper.options.viewMode = 0;
              }
            }
          },
        });
      });
  }

  /**
   * @property {Function} updateCropperPosition - Properly position Cropper element on top of image
   * @param {HTMLElement} currentImageElement
   */
  static updateCropperPosition(): void {
    if (this.cropperOuter) {
      const { left, top, width, height } =
        this.imageToCrop.getBoundingClientRect();

      this.cropperOuter.style.position = "absolute";
      this.cropperOuter.style.left = `${left}px`;
      this.cropperOuter.style.top = `${top}px`;
      this.cropperOuter.style.width = `${width}px`;
      this.cropperOuter.style.height = `${height}px`;
    }
  }

  /**
   * @property {Fucntion} applyCrop - apply crop and save cropped image
   */
  static applyCrop(): void {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas({
        minWidth: 256,
        minHeight: 256,
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: "white",
      });

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
      ctx.drawImage(canvas, 0, 0);

      const resultURL = canvas.toDataURL("image/jpeg");

      this.imageToCrop.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        resultURL
      );
      // Save cropped image to IDB
      this.current.saveToIDB(resultURL);
      // Get rid of cropper
      this.removeCropper();

      // Update cache
      this.cacheMockup(this.getCurrentMockup("svg"), this.current.currentMonth);

      this.current.cache.cacheMockup(this.getCurrentMockup("svg"), this.current.currentMonth,
        this.outputDimensions[this.current.format].width, this.outputDimensions[this.current.format].height)
    }
  }

  /**
   * @property {Fucntion} removeCropper - deactivate and destroy Cropper and its DOM elements
   */
  static removeCropper(): void {
    if (this.cropper) {
      const currentImageElement = Calendar.getCurrentMockup("image");

      currentImageElement.style.visibility = "visible";
      this.cropper.destroy();
      this.cropper = undefined;
      this.cropperOuter.innerHTML = "";

      URL.revokeObjectURL(this.tempCropImageElement.src);
      this.tempCropImageElement.remove();

      this.current.cropControlsContainer.classList.add("hide");
    }
  }

  /**
   * @property {Function} initCropperControls - Create Cropper buttons in DOM
   */
  static initCropperControls(cropControlsContainer: HTMLDivElement): void {
    this.cropperOuter = createHTMLElement({
      elementName: "div",
      className: "cropper-outer-container",
      parentToAppend: document.body,
    });

    this.applyCropBtn = createHTMLElement({
      elementName: "button",
      id: "apply-crop",
      content: icons.done,
      parentToAppend: cropControlsContainer,
    });

    this.cancelCropBtn = createHTMLElement({
      elementName: "button",
      id: "cancel-crop",
      content: icons.cancel,
      parentToAppend: cropControlsContainer,
    });

    this.applyCropBtn.addEventListener("click", () => {
      this.applyCrop();
    });

    this.cancelCropBtn.addEventListener("click", () => {
      this.removeCropper();
    });
  }

  /**
   * @property {Function} getCurrentMockup - Get current mockup to manipulate
   * @param {string} [element=""] element - selector string to pick specific element e.g. 'image' or 'svg'
   */
  static getCurrentMockup(element: string = ""): SVGElement | SVGImageElement {
    if (this.current.type === CalendarType.MultiPage) {
      return this.current.calendarInner.querySelector(
        `#month-${this.current.currentMonth}-container ${element}`
      ) as SVGElement;
    }

    return this.current.calendarInner.querySelector(
      `#mockup-container ${element}`
    ) as SVGElement;
  }

  /**
   * @property {Function} getMockupByIndex - Get mockup to manipulate by index of month
   * @param {number} index
   */
  static getMockupByIndex(index: number): SVGElement {
    return this.current.calendarInner.querySelector(
      `#mockup-${index}`
    ) as SVGElement;
  }

  // Calendar grid generate section

  /**
   * @property {Function} getOutline - create outline (<path> element) from given string, and set it x-coords, y-coords, size and fill
   * @param {string} string - text to outline
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {string} - string representation of <path> element
   */
  getOutline(
    string: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string = "bold",
    fill: string = "#231f20"
  ): string {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);
    outline.fill = fill;
    return outline.toSVG(1);
  }

  /**
   * @property {Function} getAndPlaceOutline - creates path for individual day digit in calendar grid
   * @param {string} string - text to outline (number as string)
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {SVGPathElement} - <path>
   */
  getAndPlaceOutline(
    string: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string = "bold",
    fill: string = "#231f20"
  ): SVGPathElement {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);

    const { x1, x2, y1, y2 } = outline.getBoundingBox();

    const xShift = Number(((x2 - x1) / 2).toFixed(2));
    const yShift = Number(((y2 - y1) / 2).toFixed(2));

    const pathElement = createSVGElement({
      elementName: "path",
      attributes: {
        d: outline.toPathData(1),
        transform: `translate(-${xShift} ${yShift})`,
        fill,
      },
    });

    return pathElement;
  }

  /**
   * @property {Function} getWeekDays - generates array of week days
   * @param {string} length - length of week day name
   */
  getWeekDays(length: "long" | "short" | "narrow" | undefined): string[] {
    return Array.from({ length: 7 }, (_, i) => {
      let weekDay = new Intl.DateTimeFormat(this.lang, {
        weekday: length,
      }).format(new Date(0, 0, i + 1));

      // Capitalize first letters
      if (this.lang === "ru") {
        weekDay = weekDay[0].toUpperCase() + weekDay.slice(1);
      }
      return weekDay;
    });
  }

  /**
   * @property {Function} createMonthGrid - Generates month grid in given DOM element with provided parameters
   * @param {SVGGElement} monthGrid - element to append calendar grid
   * @param {number} startIndex - first day of month
   * @param {number} totalDays - number of days in current month
   * @param {number} prevMonthDaysNumber - number of days in prev month
   * @param {number} initialX - initial X coords to place day cell
   * @param {number} initialY - initial Y coords to place day cell
   * @param {number} fontSize - Object with SVG glyphs
   * @param {string} cellStyles - additional styles for each day cell
   */
  createMonthGrid(
    monthGrid: SVGGElement,
    startIndex: number,
    totalDays: number,
    prevMonthDaysNumber: number,
    initialX: number,
    initialY: number,
    fontSize: number,
    cellStyles: string
  ): void {
    let x = initialX;
    let y = initialY;

    let currentDayIndex = startIndex;
    let prevMonthDaysCount = prevMonthDaysNumber;

    // Set empty grid
    for (let i = 1; i < 43; i++) {
      if (i % 7 !== 0) {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x += this.mockupOptions.dayCellWidth;
      } else {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x = initialX;
        y += this.mockupOptions.dayCellHeight;
      }
    }

    // All text elements in generated cells
    const cellsTextFields = monthGrid.querySelectorAll("g .cell-digit");

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      cellsTextFields[currentDayIndex].appendChild(
        this.getAndPlaceOutline(
          `${i}`,
          this.mockupOptions.dayCellWidth / 2,
          this.mockupOptions.dayCellHeight / 2,
          fontSize
        )
      );

      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].appendChild(
          this.getAndPlaceOutline(
            `${prevMonthDaysCount}`,
            this.mockupOptions.dayCellWidth / 2,
            this.mockupOptions.dayCellHeight / 2,
            fontSize,
            "regular",
            "#999"
          )
        );

        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].appendChild(
          this.getAndPlaceOutline(
            `${i}`,
            this.mockupOptions.dayCellWidth / 2,
            this.mockupOptions.dayCellHeight / 2,
            fontSize,
            "regular",
            "#999"
          )
        );

        i++;
      }
    }
  }

  /**
   * @property {Function} createDayCell - Create individual day cell
   * @param {number} x - x coordinate of cell
   * @param {number} y - y coordinate of cell
   * @param {number} cellNumber - number of day
   * @param {string} cellStyles - addition CSS styles for cell
   * @returns {SVGGElement} - DOM element of cell
   */
  createDayCell(
    x: number,
    y: number,
    cellNumber: number,
    cellStyles: string
  ): SVGGElement {
    const dayGroup = createSVGElement({
      elementName: "g",
      id: `day-${cellNumber}-cell`,
      attributes: {
        width: this.mockupOptions.dayCellWidth.toString(),
        height: this.mockupOptions.dayCellHeight.toString(),
      },
    });

    const dayRect = createSVGElement({
      elementName: "rect",
      parentToAppend: dayGroup,
      attributes: {
        x: x.toString(),
        y: y.toString(),
        width: this.mockupOptions.dayCellWidth.toString(),
        height: this.mockupOptions.dayCellHeight.toString(),
        style: cellStyles ? cellStyles : "",
      },
    });

    const cellDigit = createSVGElement({
      elementName: "g",
      parentToAppend: dayGroup,
      attributes: {
        class: "cell-digit",
        transform: `translate(${x} ${y})`,
      },
    });

    return dayGroup;
  }

  // Date functions section

  /**
   * @property {Function} daysInMonth - gives number of days in current month
   * @param {number} month - given month
   * @param {number} year - given year
   * @returns {number} - total number of days in given month
   */
  daysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  /**
   * @property {Function} getFirstDay - gives position of first day on month
   * @param {number} month
   * @param {number} year
   */
  getFirstDay(month: number, year: number): number {
    let index = new Date(year, month, 1);
    if (index.getDay() === 0) {
      return 7;
    }
    return index.getDay();
  }

  /**
   * @property {Function} saveToIDB - save current image to IndexedDB
   * @param {string} imageFile - image to save in IndexedDB
   * @param {number} [id=this.currentMonth] - index of month
   */
  saveToIDB(imageFile: string, id: number = this.currentMonth): void {
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB;

    const request = indexedDB.open("Photo Calendar Project", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("current_project_images", "readwrite");
      const store = transaction.objectStore("current_project_images");

      store.put({
        id: id,
        image: imageFile,
      });

      transaction.oncomplete = function () {
        db.close();
      };
    };
  }

  abstract createSVGMockup(): void;
}
