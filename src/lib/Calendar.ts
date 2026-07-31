import ImageCropper from './entities/ImageCropper';
import loadingOverlay from './entities/LoadingOverlay';
import UploadManager from './entities/UploadManager';

import DataController from './entities/DataController/DataController';
import DownloadManager from './entities/DownloadManager';
import ViewController from './entities/ViewController/ViewController';

import { PDFPagesRangeToDownload } from '../types';
import animateControlsContainer from './animations/animateControlsContainer';
import animateCropControlsContainer from './animations/animateCropControlsContainer';

export class Calendar {
  private dataController: DataController;

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

  constructor(DOMElements: ProvidedDOMElements, dataController: DataController) {
    this.dataController = dataController;

    // Extract data from DC
    const { lang, firstMonthIndex, startYear, type, format } =
      this.dataController.calendarProjectData;
    const storedImages = this.dataController.calendarImagesData;
    this.font = this.dataController.currentFont;
    this.outputDimensions = this.dataController.calendarOutputDimensions;
    this.mockupOptions = this.dataController.currentMockupOptions;

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
      showLoader: this.showLoader,
      hideLoader: this.hideLoader,
      onAfterRemove: () => {
        animateControlsContainer(this.controlsContainer, 'in');
        animateCropControlsContainer(this.cropControlsContainer, 'out');
      },
      saveImage: this.dataController.saveImageToIDB,
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
      saveImage: this.dataController.saveImageToIDB,
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

  onDownloadCurrentPdf = () => {
    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.Current);
  };

  onDownloadJpg = () => {
    this.downloadManager.downloadCurrentJPG();
  };

  onDownloadAllPdf = () => {
    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.All);
  };

  onCrop = async () => {
    const currentImageElement = this.viewController.getCurrentMockup('image');

    if (currentImageElement) {
      await this.imageCropper.start(currentImageElement as SVGImageElement);

      if (this.imageCropper.cropper) {
        animateControlsContainer(this.controlsContainer, 'out');
        animateCropControlsContainer(this.cropControlsContainer, 'in');
      }
    }
  };

  onUploadImage = (e: InputEvent) => {
    this.uploadManager.uploadSingleImage(e);
  };

  onUploadMultipleImages = (e: Event) => {
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
