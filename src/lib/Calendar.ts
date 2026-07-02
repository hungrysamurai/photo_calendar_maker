import { BasicControlsManager, MultiPageControlsManager } from './entities/ControlsManager';
import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import MockupsCache from './entities/MockupsCache/MockupsCache';
import UploadManager from './entities/UploadManager';

import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';

import { CalendarType, PDFPagesRangeToDownload } from '../types';

import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../assets/A_FormatOptions/A_FormatOptions';
import DataStore from './entities/DataStore/DataStore';
import DownloadManager from './entities/DownloadManager';
import ViewController from './entities/ViewController';
import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import { getMonthsList } from './utils/getMonthsList';
import getWeekDays from './utils/getWeekDays';
// import saveImageIDB from './utils/IDB/saveImageIDB';

export class Calendar {
  private dataStore;

  private imageCropper: ImageCropper;
  private controlsManager: BasicControlsManager | MultiPageControlsManager;
  private uploadManager: UploadManager;
  private downloadManager: DownloadManager;
  private viewController: ViewController;

  cache: MockupsCache;

  /**
   * Dimensions of document (px)
   */
  outputDimensions: OutputDimensions = A_outputFormats;

  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

  // Set fonts object
  font: FontData = {};

  currentMonth: number = 0;
  monthsNamesList: ReturnType<typeof getMonthsList>;

  firstMonth: number;
  startYear: number;
  lastMonth: number;
  endYear: number;

  calendarInner: HTMLDivElement;
  calendarWrapper: HTMLDivElement;

  weekDaysNamesList: string[];

  parentContainer: HTMLDivElement;
  controlsContainer: HTMLDivElement;
  cropControlsContainer: HTMLDivElement;

  constructor(DOMElements: ProvidedDOMElements, dataStore: DataStore) {
    this.dataStore = dataStore;

    const { lang, firstMonthIndex, startYear, type, format } = this.dataStore.calendarProjectData;
    this.font = this.dataStore.currentFont;

    this.parentContainer = DOMElements.calendarContainer;
    this.controlsContainer = DOMElements.controlsContainer;
    this.cropControlsContainer = DOMElements.cropControlsContainer;

    this.imageCropper = new ImageCropper(DOMElements.cropControlsContainer, {
      onBeforeStart: this.showLoader,
      onCropperReady: this.hideLoader,
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: (resultUrl) => {},
      updateCache: (svgMockup) => {},
    });

    loadingOverlay.mount(this.parentContainer, this.controlsContainer);

    this.monthsNamesList = getMonthsList(lang);

    this.firstMonth = firstMonthIndex;
    this.startYear = startYear;
    this.lastMonth = (this.firstMonth + 11) % 12;
    this.endYear = this.firstMonth === 0 ? this.startYear : this.startYear + 1;

    if (type === CalendarType.SinglePage) {
      this.controlsManager = new BasicControlsManager(this.controlsContainer, {
        onDownloadCurrentPdf: this.onDownloadCurrentPdf,
        onDownloadJpg: this.onDownloadJpg,
        onCrop: this.onCrop,
        onUploadImage: this.onUploadImage,
      });

      this.controlsManager.init();

      this.mockupOptions = new A_FormatSinglePageMockupOptions(format)[format];

      this.uploadManager = new UploadManager({
        cache: this.cache,
        format: format,
        mockupOptions: this.mockupOptions,
        outputDimensions: this.outputDimensions,
        getCurrentMonth: () => this.currentMonth,
        getCurrentMockup: this.getCurrentMockup.bind(this),
        getMockupByIndex: this.getMockupByIndex.bind(this),
        saveImage: (resultUrl, id) => saveImageIDB(resultUrl, id),
        showLoader: this.showLoader,
        hideLoader: this.hideLoader,
      });

      this.downloadManager = new DownloadManager({
        cache: this.cache,
        calendarType: type,
        calendarFirstMonth: this.firstMonth,
        calendarStartYear: this.startYear,
        calendarLastMonth: this.lastMonth,
        calendarEndYear: this.endYear,
        format: format,
        outputDimensions: this.outputDimensions,
        getCurrentMonth: () => this.currentMonth,
        getCurrentMockup: this.getCurrentMockup.bind(this),
        showLoader: this.showLoader,
        hideLoader: this.hideLoader,
      });

      this.weekDaysNamesList = getWeekDays('short', lang);
    } else {
      this.controlsManager = new MultiPageControlsManager(this.controlsContainer, {
        onDownloadCurrentPdf: this.onDownloadCurrentPdf,
        onDownloadJpg: this.onDownloadJpg,
        onCrop: this.onCrop,
        onUploadImage: this.onUploadImage,
        onDownloadAllPdf: this.onDownloadAllPdf,
        onPrevMonth: this.onPrevMonth,
        onNextMonth: this.onNextMonth,
        onUploadMultipleImages: this.onUploadMultipleImages,
      });

      this.controlsManager.init();

      this.weekDaysNamesList = getWeekDays('long', lang);

      this.mockupOptions = new A_FormatMultiPageMockupOptions(format)[format];

      this.uploadManager = new UploadManager({
        cache: this.cache,
        format: this.format,
        mockupOptions: this.mockupOptions,
        outputDimensions: this.outputDimensions,
        getCurrentMonth: () => this.currentMonth,
        getCurrentMockup: this.getCurrentMockup.bind(this),
        getMockupByIndex: this.getMockupByIndex.bind(this),
        getImageGroupByIndex: (index) =>
          this.calendarInner.querySelector(`#month-${index}-container #image-group`) as SVGGElement,
        saveImage: (resultUrl, id) => saveImageIDB(resultUrl, id),
        showLoader: this.showLoader.bind(this),
        hideLoader: this.hideLoader.bind(this),
      });

      this.downloadManager = new DownloadManager({
        cache: this.cache,
        calendarType: type,
        calendarFirstMonth: this.firstMonth,
        calendarStartYear: this.startYear,
        calendarLastMonth: this.lastMonth,
        calendarEndYear: this.endYear,
        format: format,
        outputDimensions: this.outputDimensions,
        getCurrentMonth: () => this.currentMonth,
        getCurrentMockup: this.getCurrentMockup.bind(this),
        showLoader: this.showLoader.bind(this),
        hideLoader: this.hideLoader.bind(this),
      });
    }

    this.viewController = new ViewController(this.parentContainer, type);

    console.log(this);

    // this.cache = new MockupsCache();
    // this.imageCropper = new ImageCropper(DOMElements.cropControlsContainer, {
    //   onBeforeStart: this.showLoader,
    //   onCropperReady: this.hideLoader,
    //   onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
    //   saveImage: (resultUrl) => saveImageIDB(resultUrl, this.currentMonth),
    //   updateCache: (svgMockup) => {
    //     this.cache.cacheMockup(
    //       svgMockup,
    //       this.currentMonth,
    //       this.outputDimensions[this.format].width,
    //       this.outputDimensions[this.format].height,
    //     );
    //   },
    // });
    // loadingOverlay.mount(this.parentContainer, DOMElements.controlsContainer);
    // // Add subfamilies to fonts object
    // for (let i = 0; i < currentFont.length; i++) {
    //   this.fonts[currentFont[i]?.names?.fontSubfamily.en.toLowerCase() as FontSubfamily] =
    //     currentFont[i];
    // }
    // this.monthsNamesList = getMonthsList(this.lang);
    // this.firstMonth = this.firstMonthIndex;
    // this.startYear = this.year;
    // this.lastMonth = (this.firstMonth + 11) % 12;
    // this.endYear = this.firstMonth === 0 ? this.startYear : this.startYear + 1;
    // // Subscribe on cache events
    // this.subscribeOnCacheEvents();
  }

  // subscribeOnCacheEvents() {
  //   this.cache.addEventListener('workStart', this.showLoader);
  //   this.cache.addEventListener('workDone', this.hideLoader);
  // }

  // Behaviorial callbacks

  onDownloadCurrentPdf = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.Current);
  };

  onDownloadJpg = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.downloadManager.downloadCurrentJPG();
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

  showLoader = (): void => {
    loadingOverlay.show();
  };

  hideLoader = (): void => {
    if (this.cache.state === 'idle') {
      loadingOverlay.hide();
    }
  };

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
    // this.cache.reset();
    // this.cache.removeEventListener('workStart', this.showLoader);
    // this.cache.removeEventListener('workDone', this.hideLoader);
  }

  // abstract createSVGMockup(): void;
}
