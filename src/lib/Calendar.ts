import { BasicControlsManager, MultiPageControlsManager } from './entities/ControlsManager';
import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import MockupsCache from './entities/DataStore/controllers/MockupsCacheController/MockupsCache';
import UploadManager from './entities/UploadManager';

import { CalendarType, PDFPagesRangeToDownload } from '../types';

import DataStore from './entities/DataStore/DataStore';
import DownloadManager from './entities/DownloadManager';
import ViewController from './entities/ViewController';

import { getMonthsList } from './utils/getMonthsList';

export class Calendar {
  private dataStore;

  private imageCropper: ImageCropper;
  private viewController: ViewController;
  private uploadManager: UploadManager;
  private downloadManager: DownloadManager;

  cache: MockupsCache;

  font: FontData = {};
  outputDimensions: OutputDimensions;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

  monthsNamesList: ReturnType<typeof getMonthsList>;

  firstMonth: number;
  startYear: number;
  lastMonth: number;
  endYear: number;

  calendarInner: HTMLDivElement;
  calendarWrapper: HTMLDivElement;

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

    this.viewController = new ViewController({
      mainContainer: this.parentContainer,
      controlsContainer: this.controlsContainer,
      actionsHandlers: {
        onDownloadCurrentPdf: this.onDownloadCurrentPdf,
        onDownloadJpg: this.onDownloadJpg,
        onCrop: this.onCrop,
        onUploadImage: this.onUploadImage,
        onDownloadAllPdf: this.onDownloadAllPdf,
        onUploadMultipleImages: this.onUploadMultipleImages,
      },
      cleanupHandlers: [this.removeCropperIfActive],
      type,
      format,
      firstMonthIndex,
      mockupOptions: this.mockupOptions,
      outputDimensions: this.outputDimensions,
      year: this.startYear,
      monthsNamesList: this.monthsNamesList,
      font: this.font,
      lang,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });

    this.imageCropper = new ImageCropper(DOMElements.cropControlsContainer, {
      onBeforeStart: this.showLoader,
      onCropperReady: this.hideLoader,
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: this.dataStore.saveDataToIDB,
      getCurrentMonthInViewIndex: () => this.viewController.currentMonthInView,
      getMockupByIndex: this.viewController.getMockupByIndex,
    });

    this.uploadManager = new UploadManager({
      cache: this.cache,
      format: format,
      mockupOptions: this.mockupOptions,
      outputDimensions: this.outputDimensions,
      getCurrentMonthInViewIndex: () => this.viewController.currentMonthInView,
      getCurrentMockup: this.viewController.getCurrentMockup,
      getMockupByIndex: this.viewController.getMockupByIndex,
      getImageGroupByIndex: this.viewController.getImageGroupByIndex,
      saveImage: this.dataStore.saveDataToIDB,
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
      getCurrentMonth: () => this.viewController.currentMonthInView,
      getCurrentMockup: this.viewController.getCurrentMockup,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });

    // // Subscribe on cache events
    // this.subscribeOnCacheEvents();
  }

  // subscribeOnCacheEvents() {
  //   this.cache.addEventListener('workStart', this.showLoader);
  //   this.cache.addEventListener('workDone', this.hideLoader);
  // }

  // Behaviorial callbacks

  removeCropperIfActive = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }
  };

  onDownloadCurrentPdf = () => {
    this.removeCropperIfActive();

    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.Current);
  };

  onDownloadJpg = () => {
    this.removeCropperIfActive();

    this.downloadManager.downloadCurrentJPG();
  };

  onDownloadAllPdf = () => {
    this.removeCropperIfActive();

    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.All);
  };

  onCrop = () => {
    if (this.imageCropper.isActive) return;

    const currentImageElement = this.viewController.getCurrentMockup('image');

    if (currentImageElement) {
      this.imageCropper.start(currentImageElement as SVGImageElement);
    }
  };

  onUploadImage = (e: InputEvent) => {
    this.removeCropperIfActive();

    this.uploadManager.uploadSingleImage(e);
  };

  onUploadMultipleImages = (e: Event) => {
    this.removeCropperIfActive();

    this.uploadManager.uploadMultipleImages(e);
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

  dispose(): void {
    this.imageCropper.dispose();
    // this.cache.reset();
    // this.cache.removeEventListener('workStart', this.showLoader);
    // this.cache.removeEventListener('workDone', this.hideLoader);
  }
}
