import { BasicControlsManager, MultiPageControlsManager } from './entities/ControlsManager';
import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import MockupsCache from './entities/MockupsCache/MockupsCache';
import UploadManager from './entities/UploadManager';

import { CalendarType, PDFPagesRangeToDownload } from '../types';

import DataStore from './entities/DataStore/DataStore';
import DownloadManager from './entities/DownloadManager';
import ViewController from './entities/ViewController';
import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import { getMonthsList } from './utils/getMonthsList';
import getWeekDays from './utils/getWeekDays';

export class Calendar {
  private dataStore;

  private imageCropper: ImageCropper;
  private controlsManager: BasicControlsManager | MultiPageControlsManager;
  private uploadManager: UploadManager;
  private downloadManager: DownloadManager;
  private viewController: ViewController;

  cache: MockupsCache;

  font: FontData = {};
  outputDimensions: OutputDimensions;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

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
    this.outputDimensions = this.dataStore.calendarOutputDimensions;
    this.mockupOptions = this.dataStore.currentMockupOptions;

    this.monthsNamesList = getMonthsList(lang);

    this.firstMonth = firstMonthIndex;
    this.startYear = startYear;
    this.lastMonth = (this.firstMonth + 11) % 12;
    this.endYear = this.firstMonth === 0 ? this.startYear : this.startYear + 1;

    this.parentContainer = DOMElements.calendarContainer;
    this.controlsContainer = DOMElements.controlsContainer;
    this.cropControlsContainer = DOMElements.cropControlsContainer;

    loadingOverlay.mount(this.parentContainer, this.controlsContainer);

    this.imageCropper = new ImageCropper(DOMElements.cropControlsContainer, {
      onBeforeStart: this.showLoader,
      onCropperReady: this.hideLoader,
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: (resultUrl) => {},
      updateCache: (svgMockup) => {},
    });

    if (type === CalendarType.SinglePage) {
      this.controlsManager = new BasicControlsManager(this.controlsContainer, {
        onDownloadCurrentPdf: this.onDownloadCurrentPdf,
        onDownloadJpg: this.onDownloadJpg,
        onCrop: this.onCrop,
        onUploadImage: this.onUploadImage,
      });

      this.controlsManager.init();

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

      this.weekDaysNamesList = getWeekDays('long', lang);
    }

    this.viewController = new ViewController({
      mainContainer: this.parentContainer,
      type,
      format,
      firstMonthIndex,
      mockupOptions: this.mockupOptions,
      outputDimensions: this.outputDimensions,
      year: this.startYear,
      monthsNamesList: this.monthsNamesList,
      weekDaysNamesList: this.weekDaysNamesList,
      font: this.font,
      lang,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });

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
    // if (this.cache.state === 'idle') {
    loadingOverlay.hide();
    // }
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

  dispose(): void {
    // this.cache.reset();
    // this.cache.removeEventListener('workStart', this.showLoader);
    // this.cache.removeEventListener('workDone', this.hideLoader);
  }
}
