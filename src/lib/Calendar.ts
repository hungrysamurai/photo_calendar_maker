import { BasicControlsManager, MultiPageControlsManager } from './entities/ControlsManager';
import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import MockupsCache from './entities/MockupsCache/MockupsCache';
import UploadManager from './entities/UploadManager';

import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';

import {
  CalendarLanguage,
  CalendarType,
  FontSubfamily,
  FormatName,
  PDFPagesRangeToDownload,
} from '../types';

import DownloadManager from './entities/DownloadManager';
import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import { getMonthsList } from './utils/getMonthsList';
import saveImageIDB from './utils/IDB/saveImageIDB';

export abstract class Calendar {
  cache: MockupsCache;
  controlsManager: BasicControlsManager | MultiPageControlsManager;
  imageCropper: ImageCropper;
  uploadManager: UploadManager;
  downloadManager: DownloadManager;

  /**
   * Dimensions of document (px)
   */
  outputDimensions: OutputDimensions = A_outputFormats;

  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

  // Set fonts object
  fonts: FontData = {};

  currentMonth: number = 0;
  monthsNamesList: ReturnType<typeof getMonthsList>;
  monthCounter: number;

  firstMonth: number;
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
      onBeforeStart: this.showLoader,
      onCropperReady: this.hideLoader,
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: (resultUrl) => saveImageIDB(resultUrl, this.currentMonth),
      updateCache: (svgMockup) => {
        this.cache.cacheMockup(
          svgMockup,
          this.currentMonth,
          this.outputDimensions[this.format].width,
          this.outputDimensions[this.format].height,
        );
      },
    });
    loadingOverlay.mount(parentContainer, controlsContainer);

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

    this.firstMonth = this.firstMonthIndex;
    this.startYear = this.year;
    this.lastMonth = (this.firstMonth + 11) % 12;
    console.log(this.lastMonth);

    // Subscribe on cache events
    this.subscribeOnCacheEvents();
  }

  subscribeOnCacheEvents() {
    this.cache.addEventListener('workStart', this.showLoader);
    this.cache.addEventListener('workDone', this.hideLoader);
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

    const currentImageElement = this.getCurrentMockup('image');

    if (currentImageElement) {
      this.imageCropper.start(currentImageElement as SVGImageElement);
    }
  };

  onUploadImage = (e: InputEvent) => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.uploadManager.uploadSingleImage(e);
  };

  // Show/hide loader

  showLoader(): void {
    loadingOverlay.show();
  }

  hideLoader(): void {
    loadingOverlay.hide();
  }

  /**
   *
   * @property {Function} downloadCurrentJPG - Download current (visible) svg mockup
   */
  downloadCurrentJPG(): void {
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
    this.showLoader();
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
        this.outputDimensions[this.format].width,
        this.outputDimensions[this.format].height,
      ]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: this.outputDimensions[this.format].width,
        height: this.outputDimensions[this.format].height,
      });
    }

    const arrayBuffer = (await pdf.save()) as Uint8Array<ArrayBuffer>;

    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobURL = URL.createObjectURL(blob);

    const fileName = this.getFileName(range === PDFPagesRangeToDownload.All);

    this.downloadElement(blobURL, fileName);

    this.hideLoader();
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

    const currentMonthContainer = this.getCurrentMockup();

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
  getCurrentMockup(element: string = ''): SVGElement | SVGImageElement {
    if (this.type === CalendarType.MultiPage) {
      return this.calendarInner.querySelector(
        `#month-${this.currentMonth}-container ${element}`,
      ) as SVGElement;
    }

    return this.calendarInner.querySelector(`#mockup-container ${element}`) as SVGElement;
  }

  /**
   * @property {Function} getMockupByIndex - Get mockup to manipulate by index of month
   * @param {number} index
   */
  getMockupByIndex(index: number): SVGElement {
    return this.calendarInner.querySelector(`#mockup-${index}`) as SVGElement;
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

  dispose(): void {
    this.cache.reset();

    // Unsubscribe from old cache events
    this.cache.removeEventListener('workStart', this.showLoader);
    this.cache.removeEventListener('workDone', this.hideLoader);
  }

  abstract createSVGMockup(): void;
}
