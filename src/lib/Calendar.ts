import ImageCropper from './entities/ImageCropper';

import { getMonthsList } from './utils/getMonthsList';

import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';
/**
 * Object with SVG icons
 */

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
  imageCropper: ImageCropper;
  /**
   * Dimensions of document (px)
   */
  static outputDimensions: OutputDimensions = A_outputFormats;

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
    this.imageCropper = new ImageCropper(cropControlsContainer, {
      onBeforeStart: () => loadingOverlay.show(),
      onCropperReady: () => loadingOverlay.hide(),
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: (resultUrl) => saveImageIDB(resultUrl, this.currentMonth),
      updateCache: (svgMockup) => {
        this.cache.cacheMockup(
          svgMockup,
          this.currentMonth,
          Calendar.outputDimensions[this.format].width,
          Calendar.outputDimensions[this.format].height,
        );
      },
    });

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
    } else {
      Calendar.current.cache.reset();
    }

    // Subscribe on cache events
    this.subscribeOnCacheEvents();

    // Reassign current to newly created instance
    Calendar.current = this;
  }

  subscribeOnCacheEvents() {
    this.cache.addEventListener('workStart', () => {
      loadingOverlay.show();
    });

    this.cache.addEventListener('workDone', () => {
      loadingOverlay.hide();
    });
  }

  // Behaviorial callbacks

  onDownloadCurrentPdf = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.downloadPDF(PDFPagesRangeToDownload.Current);
  };

  onDownloadJpg = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.downloadCurrentJPG();
  };

  onCrop = () => {
    if (this.imageCropper.isActive) return;

    const currentImageElement = Calendar.getCurrentMockup('image');

    if (currentImageElement) {
      this.imageCropper.start(currentImageElement as SVGImageElement);
    }
  };

  onUploadImage = (e: InputEvent) => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
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
