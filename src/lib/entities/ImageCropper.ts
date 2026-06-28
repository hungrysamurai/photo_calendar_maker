import Cropper from 'cropperjs';

import { icons } from '../../assets/icons';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';

export type ImageCropperCallbacks = {
  saveImage: (resultUrl: string) => void;
  updateCache: (svgMockup: SVGElement) => void;
  onBeforeStart: () => void;
  onCropperReady: () => void;
  onAfterRemove?: () => void;
};

export default class ImageCropper {
  cropperOuter: HTMLDivElement;
  cropper?: Cropper;
  imageToCrop?: SVGImageElement;
  tempCropImageElement?: HTMLImageElement;
  applyCropBtn: HTMLButtonElement;
  cancelCropBtn: HTMLButtonElement;
  cropControlsContainer: HTMLDivElement;
  callbacks: ImageCropperCallbacks;

  private boundUpdateCropperPosition = this.updateCropperPosition.bind(this);

  constructor(cropControlsContainer: HTMLDivElement, callbacks: ImageCropperCallbacks) {
    this.cropControlsContainer = cropControlsContainer;
    this.callbacks = callbacks;

    this.cropControlsContainer.innerHTML = '';

    this.cropperOuter = createHTMLElement({
      elementName: 'div',
      className: 'cropper-outer-container',
      parentToAppend: document.body,
    }) as HTMLDivElement;

    this.applyCropBtn = createHTMLElement({
      elementName: 'button',
      id: 'apply-crop',
      content: icons.done,
      parentToAppend: this.cropControlsContainer,
    }) as HTMLButtonElement;

    this.cancelCropBtn = createHTMLElement({
      elementName: 'button',
      id: 'cancel-crop',
      content: icons.cancel,
      parentToAppend: this.cropControlsContainer,
    }) as HTMLButtonElement;

    this.cropControlsContainer.classList.add('hide');

    this.applyCropBtn.addEventListener('click', () => this.applyCrop());
    this.cancelCropBtn.addEventListener('click', () => this.removeCropper());
  }

  get isActive(): boolean {
    return Boolean(this.cropper);
  }

  async start(imageElement: SVGImageElement): Promise<void> {
    if (this.cropper) return;

    this.imageToCrop = imageElement;

    this.callbacks.onBeforeStart();

    const imageFile = this.imageToCrop.getAttribute('href') as string;
    const blob = await fetch(imageFile).then((res) => res.blob());

    this.updateCropperPosition();

    this.tempCropImageElement = createHTMLElement({
      elementName: 'img',
      className: 'image-element',
      parentToAppend: this.cropperOuter,
      attributes: {
        src: URL.createObjectURL(blob),
      },
    }) as HTMLImageElement;

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

        window.addEventListener('resize', this.boundUpdateCropperPosition);

        this.cropControlsContainer.classList.remove('hide');

        this.callbacks.onCropperReady();
      },

      zoom: (e) => {
        if (!this.cropper) return;

        this.cropper.crop();
        this.cropper.setAspectRatio(0);

        this.cropper.setCropBoxData({
          width: this.cropper.getContainerData().width,
          height: this.cropper.getContainerData().height,
        });

        if (e.detail.ratio < e.detail.oldRatio) {
          if (this.cropper.getCanvasData().width - 10 < this.cropper.initialCanvasData.width) {
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
      },
    });
  }

  private updateCropperPosition(): void {
    if (!this.cropperOuter || !this.imageToCrop) return;

    const { left, top, width, height } = this.imageToCrop.getBoundingClientRect();

    this.cropperOuter.style.position = 'absolute';
    this.cropperOuter.style.left = `${left}px`;
    this.cropperOuter.style.top = `${top}px`;
    this.cropperOuter.style.width = `${width}px`;
    this.cropperOuter.style.height = `${height}px`;
  }

  applyCrop(): void {
    if (!this.cropper || !this.imageToCrop) return;

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

    this.callbacks.saveImage(resultURL);

    const svgMockup =
      this.imageToCrop.ownerSVGElement ?? (this.imageToCrop.closest('svg') as SVGSVGElement);
    if (svgMockup) {
      this.callbacks.updateCache(svgMockup);
    }

    this.removeCropper();
  }

  removeCropper(): void {
    if (!this.cropper || !this.imageToCrop) return;

    this.imageToCrop.style.visibility = 'visible';
    this.cropper.destroy();
    this.cropper = undefined;

    window.removeEventListener('resize', this.boundUpdateCropperPosition);

    if (this.tempCropImageElement) {
      URL.revokeObjectURL(this.tempCropImageElement.src);
      this.tempCropImageElement.remove();
      this.tempCropImageElement = undefined;
    }

    this.cropperOuter.innerHTML = '';
    this.cropControlsContainer.classList.add('hide');
    this.callbacks.onAfterRemove?.();
  }
}
