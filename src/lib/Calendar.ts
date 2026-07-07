import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import UploadManager from './entities/UploadManager';

import DataStore from './entities/DataStore/DataStore';
import DownloadManager from './entities/DownloadManager';
import ViewController from './entities/ViewController/ViewController';

import { PDFPagesRangeToDownload } from '../types';

export class Calendar {
  private dataStore;

  private imageCropper: ImageCropper;
  private viewController: ViewController;
  private uploadManager: UploadManager;
  private downloadManager: DownloadManager;

  font: FontData = {};
  outputDimensions: OutputDimensions;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;

  firstMonth: number;
  startYear: number;
  lastMonth: number;
  endYear: number;

  parentContainer: HTMLDivElement;
  controlsContainer: HTMLDivElement;
  cropControlsContainer: HTMLDivElement;

  constructor(DOMElements: ProvidedDOMElements, dataStore: DataStore) {
    this.dataStore = dataStore;

    // Extract data from DS
    const { lang, firstMonthIndex, startYear, type, format } = this.dataStore.calendarProjectData;
    const storedImages = this.dataStore.calendarImagesData;
    this.font = this.dataStore.currentFont;
    this.outputDimensions = this.dataStore.calendarOutputDimensions;
    this.mockupOptions = this.dataStore.currentMockupOptions;

    // Set params of calendar
    this.firstMonth = firstMonthIndex;
    this.startYear = startYear;
    this.lastMonth = (this.firstMonth + 11) % 12;
    this.endYear = this.firstMonth === 0 ? this.startYear : this.startYear + 1;

    // Use provided DOM elements
    this.parentContainer = DOMElements.calendarContainer;
    this.controlsContainer = DOMElements.controlsContainer;
    this.cropControlsContainer = DOMElements.cropControlsContainer;

    // Get loader
    loadingOverlay.mount(this.parentContainer, this.controlsContainer);

    // Init view & SVG mockup
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
      font: this.font,
      lang,
      storedImages,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });

    // Cropper
    this.imageCropper = new ImageCropper(DOMElements.cropControlsContainer, {
      onBeforeStart: this.showLoader,
      onCropperReady: this.hideLoader,
      onAfterRemove: () => this.cropControlsContainer.classList.add('hide'),
      saveImage: this.dataStore.saveImageToIDB,
      getCurrentMonthInViewIndex: () => this.viewController.currentMonthInView,
      getMockupByIndex: this.viewController.getMockupByIndex,
    });

    // Uploader
    this.uploadManager = new UploadManager({
      format: format,
      mockupOptions: this.mockupOptions,
      outputDimensions: this.outputDimensions,
      getCurrentMonthInViewIndex: () => this.viewController.currentMonthInView,
      getCurrentMockup: this.viewController.getCurrentMockup,
      getMockupByIndex: this.viewController.getMockupByIndex,
      getImageGroupByIndex: this.viewController.getImageGroupByIndex,
      saveImage: this.dataStore.saveImageToIDB,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });

    // Downloader
    this.downloadManager = new DownloadManager({
      calendarType: type,
      calendarFirstMonth: this.firstMonth,
      calendarStartYear: this.startYear,
      calendarLastMonth: this.lastMonth,
      calendarEndYear: this.endYear,
      format: format,
      outputDimensions: this.outputDimensions,
      mockupOptions: this.mockupOptions,
      getCurrentMonth: () => this.viewController.currentMonthInView,
      getCurrentMockup: this.viewController.getCurrentMockup,
      svgMockups: this.viewController.svgMockups,
      storedImages,
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
    });
  }

  removeCropperIfActive = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }
  };

  onDownloadCurrentPdf = () => {
    this.removeCropperIfActive();

    // this.downloadManager.downloadPDF(PDFPagesRangeToDownload.Current);
    this.downloadManager.downloadPDF2();
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
    loadingOverlay.hide();
  };

  dispose(): void {
    this.viewController.svgMockups.forEach((m) => {
      const imageLink = m.querySelector('image')?.href.baseVal;
      if (imageLink) URL.revokeObjectURL(imageLink);
    });
    this.imageCropper.dispose();
  }
}
