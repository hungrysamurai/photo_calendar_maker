import Cropper from 'cropperjs';

import { createHTMLElement } from './utils/DOM/createElement/createHTMLElement';
import { getMonthsList } from './utils/getMonthsList';

import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';
/**
 * Object with SVG icons
 */
import { icons } from '../assets/icons';

import {
  CalendarLanguage,
  CalendarType,
  FontSubfamily,
  FormatName,
  PDFPagesRangeToDownload,
} from '../types';

import { BasicControlsManager, MultiPageControlsManager } from './entities/ControlsManager';
import loadingOverlay from './entities/LoadingOverlay';
import MockupsCache from './entities/MockupsCache/MockupsCache';

import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import saveImageIDB from './utils/IDB/saveImageIDB';

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

  cache: MockupsCache;

  controlsManager: BasicControlsManager | MultiPageControlsManager;

  /**
   * Dimensions of document (px)
   */
  static outputDimensions: OutputDimensions = A_outputFormats;

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

  calendarInner: HTMLDivElement;
  calendarWrapper: HTMLDivElement;

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
    public format: FormatName,
  ) {
    this.cache = new MockupsCache();

    // Add subfamilies to fonts object
    for (let i = 0; i < currentFont.length; i++) {
      this.fonts[currentFont[i]?.names?.fontSubfamily.en.toLowerCase() as FontSubfamily] =
        currentFont[i];
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
      loadingOverlay.mount(parentContainer, controlsContainer);

      Calendar.initCropperControls(cropControlsContainer);
    } else {
      Calendar.current.cache.reset();
    }

    // Subscribe on cache events
    this.initCacheEvents();

    // Reassign current to newly created instance
    Calendar.current = this;
  }

  initCacheEvents() {
    this.cache.addEventListener('workStart', () => {
      this.controlsManager.setControlsState(false);
    });

    this.cache.addEventListener('workDone', () => {
      this.controlsManager.setControlsState(true);
    });
  }

  onDownloadCurrentPdf = () => {
    if (Calendar.cropper) {
      Calendar.removeCropper();
    }

    this.downloadPDF(PDFPagesRangeToDownload.Current);
  };

  onDownloadJpg = () => {
    if (Calendar.cropper) {
      Calendar.removeCropper();
    }
    console.log(this);

    this.downloadCurrentJPG();
  };

  onCrop = () => {
    if (Calendar.cropper) return;

    const currentImageElement = Calendar.getCurrentMockup('image');

    if (currentImageElement) {
      loadingOverlay.show();

      Calendar.imageToCrop = currentImageElement as SVGImageElement;
      Calendar.initCropper();
      Calendar.current.cropControlsContainer.classList.remove('hide');
    }
  };

  onUploadImage = (e: InputEvent) => {
    if (Calendar.cropper) {
      Calendar.removeCropper();
    }
    this.uploadImg(e);
  };

  // Upload/download section

  /**
   * @async
   * @property {Function} uploadImg - Upload single image
   * @param {e} e - Event object that fires when upload single image button pressed
   */
  async uploadImg(e: Event) {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const imageFile = e.target.files[0];
      const reader = new FileReader();

      loadingOverlay.show();

      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const imageGroup = Calendar.getCurrentMockup('#image-group');
        imageGroup.innerHTML = '';

        const imageEl = createSVGElement({
          elementName: 'image',
          attributes: {
            height: this.mockupOptions.imagePlaceholderHeight.toString(),
            width: this.mockupOptions.imagePlaceholderWidth.toString(),
            x: this.mockupOptions.imagePlaceholderX.toString(),
            y: this.mockupOptions.imagePlaceholderY.toString(),
          },
          parentToAppend: imageGroup,
        });

        // Image optimization
        const reduced = await this.reduceImageSize(
          reader.result as string,
          this.mockupOptions.imagePlaceholderWidth * this.imageReduceSizeRate,
          this.mockupOptions.imagePlaceholderHeight * this.imageReduceSizeRate,
        );

        const resultImage = reduced ? reduced : reader.result;
        imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', resultImage as string);

        // Save image to IDB
        saveImageIDB(resultImage as string, this.currentMonth);

        // Cache mockup after change
        this.cache.cacheMockup(
          Calendar.getCurrentMockup('svg'),
          this.currentMonth,
          Calendar.outputDimensions[this.format].width,
          Calendar.outputDimensions[this.format].height,
        );

        loadingOverlay.hide();
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
  async reduceImageSize(
    base64Str: string,
    maxWidth: number,
    maxHeight: number,
  ): Promise<void | string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width <= maxWidth && height <= maxHeight) {
          // If resolution of image is less than actual placeholder size
          resolve();
        }
        const canvas = document.createElement('canvas');
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
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0, width, height);
        // Return reduced image
        resolve(canvas.toDataURL('image/png'));
      };
    });
  }

  /**
   * @async
   * @property {Function} downloadCurrentJPG - Download current (visible) svg mockup
   */
  async downloadCurrentJPG(): Promise<void> {
    const url = URL.createObjectURL(this.cache.cachedMockups[this.currentMonth]);
    const fileName = this.getFileName();

    this.downloadElement(url, fileName);
  }

  /**
   * @async
   * @property {Function} downloadPDF - download as PDF
   * @param {string} range - single-page/all pages
   */
  async downloadPDF(range: PDFPagesRangeToDownload): Promise<void> {
    loadingOverlay.show();
    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();

    const pagesToDownload =
      range === PDFPagesRangeToDownload.All
        ? this.cache.cachedMockups
        : [this.cache.cachedMockups[this.currentMonth]];

    for (const blob of pagesToDownload) {
      const arrayBuffer = await blob.arrayBuffer();

      const image = await pdf.embedJpg(arrayBuffer);
      const page = pdf.addPage([
        Calendar.outputDimensions[this.format].width,
        Calendar.outputDimensions[this.format].height,
      ]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: Calendar.outputDimensions[this.format].width,
        height: Calendar.outputDimensions[this.format].height,
      });
    }

    const arrayBuffer = (await pdf.save()) as Uint8Array<ArrayBuffer>;

    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobURL = URL.createObjectURL(blob);

    const fileName = this.getFileName(range === PDFPagesRangeToDownload.All);

    this.downloadElement(blobURL, fileName);

    loadingOverlay.hide();
    URL.revokeObjectURL(blobURL);
  }

  /**
   * @property {Fucntion} downloadElement - create link element, download object, destroy link element
   * @param {string} elementURL - URL of blob or canvas to download
   * @param {string} fileName
   */
  downloadElement(elementURL: string, fileName: string): void {
    const a = document.createElement('a');
    a.download = fileName;
    a.href = elementURL;
    a.click();
    a.remove();
  }

  /**
   * @property {Function} getFileName - Generates name of file
   * @param {boolean} span
   */
  getFileName(span?: boolean): string {
    if (span || this.type === CalendarType.SinglePage) {
      const firstMonth = this.firstMonth;
      const firstMonthYear = this.startYear;

      const date1 = new Date(Number(firstMonthYear), Number(firstMonth));
      const firstMonthName = date1.toLocaleString('default', { month: 'long' });

      const lastMonth = this.lastMonth;
      const lastMonthYear = this.endYear;

      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString('default', {
        month: 'long',
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear}`;
    }

    const currentMonthContainer = Calendar.getCurrentMockup();

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(Number(year), Number(month));
    const monthName = date.toLocaleString('default', { month: 'long' });

    return `${monthName}_${year}`;
  }

  // Crop functionality section

  /**
   * @property {Function} initCropper - create Cropper object, initCropper on current svg mockup image element
   */
  static initCropper(): void {
    const imageFile = this.imageToCrop.getAttribute('href') as string;

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        // Position cropper element on top of placeholder
        this.updateCropperPosition();

        this.tempCropImageElement = createHTMLElement({
          elementName: 'img',
          className: 'image-element',
          parentToAppend: this.cropperOuter,
          attributes: {
            src: URL.createObjectURL(imageFile),
          },
        });

        this.imageToCrop.style.visibility = 'hidden';

        this.cropper = new Cropper(this.tempCropImageElement, {
          viewMode: 0,
          dragMode: 'none',
          modal: false,
          background: false,
          autoCropArea: 1,
          ready: () => {
            if (this.cropper) {
              this.cropper.initialZoomRatio =
                this.cropper.getCanvasData().width / this.cropper.getCanvasData().naturalWidth;
            }

            window.onresize = () => {
              this.updateCropperPosition();
            };
            loadingOverlay.hide();
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
                this.cropper.getCanvasData().width / this.cropper.getCanvasData().naturalWidth;

              if (this.cropper.zoomRatio.toFixed(5) > this.cropper.initialZoomRatio.toFixed(5)) {
                this.cropper.setDragMode('move');
                this.cropper.options.viewMode = 3;
              } else {
                this.cropper.setDragMode('none');
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
      const { left, top, width, height } = this.imageToCrop.getBoundingClientRect();

      this.cropperOuter.style.position = 'absolute';
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
        fillColor: 'white',
      });

      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
      ctx.drawImage(canvas, 0, 0);

      const resultURL = canvas.toDataURL('image/jpeg');

      this.imageToCrop.setAttributeNS('http://www.w3.org/1999/xlink', 'href', resultURL);
      // Save cropped image to IDB
      saveImageIDB(resultURL, this.current.currentMonth);
      // Get rid of cropper
      this.removeCropper();

      // Update cache
      this.current.cache.cacheMockup(
        this.getCurrentMockup('svg'),
        this.current.currentMonth,
        this.outputDimensions[this.current.format].width,
        this.outputDimensions[this.current.format].height,
      );
    }
  }

  /**
   * @property {Fucntion} removeCropper - deactivate and destroy Cropper and its DOM elements
   */
  static removeCropper(): void {
    if (this.cropper) {
      const currentImageElement = Calendar.getCurrentMockup('image');

      currentImageElement.style.visibility = 'visible';
      this.cropper.destroy();
      this.cropper = undefined;
      this.cropperOuter.innerHTML = '';

      URL.revokeObjectURL(this.tempCropImageElement.src);
      this.tempCropImageElement.remove();

      this.current.cropControlsContainer.classList.add('hide');
    }
  }

  /**
   * @property {Function} initCropperControls - Create Cropper buttons in DOM
   */
  static initCropperControls(cropControlsContainer: HTMLDivElement): void {
    this.cropperOuter = createHTMLElement({
      elementName: 'div',
      className: 'cropper-outer-container',
      parentToAppend: document.body,
    });

    this.applyCropBtn = createHTMLElement({
      elementName: 'button',
      id: 'apply-crop',
      content: icons.done,
      parentToAppend: cropControlsContainer,
    });

    this.cancelCropBtn = createHTMLElement({
      elementName: 'button',
      id: 'cancel-crop',
      content: icons.cancel,
      parentToAppend: cropControlsContainer,
    });

    this.applyCropBtn.addEventListener('click', () => {
      this.applyCrop();
    });

    this.cancelCropBtn.addEventListener('click', () => {
      this.removeCropper();
    });
  }

  /**
   * @property {Function} getCurrentMockup - Get current mockup to manipulate
   * @param {string} [element=""] element - selector string to pick specific element e.g. 'image' or 'svg'
   */
  static getCurrentMockup(element: string = ''): SVGElement | SVGImageElement {
    if (this.current.type === CalendarType.MultiPage) {
      return this.current.calendarInner.querySelector(
        `#month-${this.current.currentMonth}-container ${element}`,
      ) as SVGElement;
    }

    return this.current.calendarInner.querySelector(`#mockup-container ${element}`) as SVGElement;
  }

  /**
   * @property {Function} getMockupByIndex - Get mockup to manipulate by index of month
   * @param {number} index
   */
  static getMockupByIndex(index: number): SVGElement {
    return this.current.calendarInner.querySelector(`#mockup-${index}`) as SVGElement;
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
    fontWeight: string = 'bold',
    fill: string = '#231f20',
  ): string {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);
    outline.fill = fill;
    return outline.toSVG(2);
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
    fontWeight: string = 'bold',
    fill: string = '#231f20',
  ): SVGPathElement {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);

    const { x1, x2, y1, y2 } = outline.getBoundingBox();

    const xShift = Number(((x2 - x1) / 2).toFixed(2));
    const yShift = Number(((y2 - y1) / 2).toFixed(2));

    const pathElement = createSVGElement({
      elementName: 'path',
      attributes: {
        d: outline.toPathData(2),
        transform: `translate(-${xShift} ${yShift})`,
        fill,
      },
    });

    return pathElement;
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
    cellStyles: string,
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
    const cellsTextFields = monthGrid.querySelectorAll('g .cell-digit');

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      cellsTextFields[currentDayIndex].appendChild(
        this.getAndPlaceOutline(
          `${i}`,
          this.mockupOptions.dayCellWidth / 2,
          this.mockupOptions.dayCellHeight / 2,
          fontSize,
        ),
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
            'regular',
            '#999',
          ),
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
            'regular',
            '#999',
          ),
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
  createDayCell(x: number, y: number, cellNumber: number, cellStyles: string): SVGGElement {
    const dayGroup = createSVGElement({
      elementName: 'g',
      id: `day-${cellNumber}-cell`,
      attributes: {
        width: this.mockupOptions.dayCellWidth.toString(),
        height: this.mockupOptions.dayCellHeight.toString(),
      },
    });

    createSVGElement({
      elementName: 'rect',
      parentToAppend: dayGroup,
      attributes: {
        x: x.toString(),
        y: y.toString(),
        width: this.mockupOptions.dayCellWidth.toString(),
        height: this.mockupOptions.dayCellHeight.toString(),
        style: cellStyles ? cellStyles : '',
      },
    });

    createSVGElement({
      elementName: 'g',
      parentToAppend: dayGroup,
      attributes: {
        class: 'cell-digit',
        transform: `translate(${x} ${y})`,
      },
    });

    return dayGroup;
  }

  abstract createSVGMockup(): void;
}
