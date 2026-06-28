import { icons } from '../../assets/icons';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';

export type ControlsCallbacks = {
  onDownloadCurrentPdf: () => void;
  onDownloadJpg: () => void;
  onCrop: () => void;
  onUploadImage: (event: InputEvent) => void;
};

export type MultiPageControlsCallbacks = ControlsCallbacks & {
  onDownloadAllPdf: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onUploadMultipleImages: (event: Event) => void;
};

export abstract class ControlsManager {
  constructor(protected controlsContainer: HTMLDivElement) {}

  init(): void {
    this.controlsContainer.innerHTML = '';
    this.createControls();
    this.bindEvents();
  }

  protected abstract createControls(): void;
  protected abstract bindEvents(): void;
}

export class BasicControlsManager extends ControlsManager {
  currentPDFDownloadBtn!: HTMLButtonElement;
  jpgDownloadBtn!: HTMLButtonElement;
  cropBtn!: HTMLButtonElement;
  uploadImgInput!: HTMLInputElement;
  uploadImgBtn!: HTMLLabelElement;

  constructor(
    controlsContainer: HTMLDivElement,
    protected callbacks: ControlsCallbacks,
  ) {
    super(controlsContainer);
  }

  protected createControls(): void {
    this.currentPDFDownloadBtn = createHTMLElement({
      elementName: 'button',
      parentToAppend: this.controlsContainer,
      id: 'pdf-download-current',
      content: icons.pdfSingle,
    });

    this.jpgDownloadBtn = createHTMLElement({
      elementName: 'button',
      parentToAppend: this.controlsContainer,
      id: 'jpg-download',
      content: icons.jpg,
    });

    this.cropBtn = createHTMLElement({
      elementName: 'button',
      id: 'crop-btn',
      content: icons.crop,
      parentToAppend: this.controlsContainer,
    });

    this.uploadImgInput = createHTMLElement({
      elementName: 'input',
      id: 'upload-input',
      parentToAppend: this.controlsContainer,
      attributes: {
        type: 'file',
        accept: 'image/jpeg, image/png, image/jpg',
        hidden: 'true',
        onclick: 'this.value=null;',
      },
    });

    this.uploadImgBtn = createHTMLElement({
      elementName: 'label',
      id: 'upload-btn',
      content: icons.upload,
      className: 'upload-btn',
      parentToAppend: this.controlsContainer,
      attributes: {
        for: 'upload-input',
      },
    });
  }

  protected bindEvents(): void {
    this.currentPDFDownloadBtn.addEventListener('click', () => {
      this.callbacks.onDownloadCurrentPdf();
    });

    this.jpgDownloadBtn.addEventListener('click', () => {
      this.callbacks.onDownloadJpg();
    });

    this.cropBtn.addEventListener('click', () => {
      this.callbacks.onCrop();
    });

    this.uploadImgInput.addEventListener('input', (event) => {
      this.callbacks.onUploadImage(event as InputEvent);
    });
  }
}

export class MultiPageControlsManager extends BasicControlsManager {
  prevBtn!: HTMLButtonElement;
  nextBtn!: HTMLButtonElement;
  allPDFDownloadBtn!: HTMLButtonElement;
  multipleImagesInput!: HTMLInputElement;
  uploadMultipleImgsBtn!: HTMLLabelElement;

  constructor(
    controlsContainer: HTMLDivElement,
    protected callbacks: MultiPageControlsCallbacks,
  ) {
    super(controlsContainer, callbacks);
  }

  protected createControls(): void {
    super.createControls();
    this.allPDFDownloadBtn = createHTMLElement({
      elementName: 'button',
      id: 'pdf-download-all',
      content: icons.pdfMulti,
      insertTo: {
        element: this.controlsContainer,
        position: 'afterbegin',
      },
    });

    this.prevBtn = createHTMLElement({
      elementName: 'button',
      id: 'prev-month',
      content: icons.prev,
      insertTo: {
        element: this.controlsContainer,
        position: 'afterbegin',
      },
    });

    this.multipleImagesInput = createHTMLElement({
      elementName: 'input',
      id: 'upload-multiple-input',
      attributes: {
        type: 'file',
        multiple: 'multiple',
        hidden: 'true',
        accept: 'image/jpeg, image/png, image/jpg',
        onclick: 'this.value=null;',
      },
      insertTo: {
        element: this.controlsContainer,
        position: 'beforeend',
      },
    });

    this.uploadMultipleImgsBtn = createHTMLElement({
      elementName: 'label',
      id: 'upload-multiple',
      content: icons.uploadMulti,
      attributes: {
        for: 'upload-multiple-input',
      },
      insertTo: {
        element: this.controlsContainer,
        position: 'beforeend',
      },
    });

    this.nextBtn = createHTMLElement({
      elementName: 'button',
      id: 'next-month',
      content: icons.next,
      insertTo: {
        element: this.controlsContainer,
        position: 'beforeend',
      },
    });
  }

  protected bindEvents(): void {
    super.bindEvents();

    this.prevBtn.addEventListener('click', () => {
      this.callbacks.onPrevMonth();
    });

    this.nextBtn.addEventListener('click', () => {
      this.callbacks.onNextMonth();
    });

    this.allPDFDownloadBtn.addEventListener('click', () => {
      this.callbacks.onDownloadAllPdf();
    });

    this.multipleImagesInput.addEventListener('change', (event) => {
      this.callbacks.onUploadMultipleImages(event);
    });
  }
}
