import { CropperView, type CropResult } from '@hungrysamurai/cropper';

import { icons } from '../../assets/icons';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';

export type ImageCropperCallbacks = {
  saveImage: (image: Blob, index: number) => Promise<void>;
  getCurrentMonthInViewIndex: () => number;
  getMockupByIndex: (index: number) => SVGElement;
  showLoader: () => void;
  hideLoader: () => void;
  onAfterRemove?: () => void;
};

export default class ImageCropper {
  cropperOuter: HTMLDivElement;
  imageToCrop?: SVGImageElement;
  applyCropBtn: HTMLButtonElement;
  cancelCropBtn: HTMLButtonElement;
  cropControlsContainer: HTMLDivElement;
  callbacks: ImageCropperCallbacks;

  private view: CropperView;
  // The view is idle while the result is saved, but the tool is not done yet
  private isSaving = false;
  private isDisposed = false;
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

    // Contain matches the SVG's default letterboxing, so opening the tool never crops by itself
    this.view = new CropperView(this.cropperOuter, {
      fit: 'contain',
      // Stored photos are shrunk to ~1100px, so the default of 1 would barely allow any zoom
      maxScale: 8,
      grid: false,
      output: {
        type: 'image/jpeg',
        minWidth: 256,
        minHeight: 256,
        maxWidth: 4096,
        maxHeight: 4096,
        clipToImage: true,
      },
    });

    // Covers both the apply button and Enter inside the view
    this.view.on('accept', (result) => void this.applyCrop(result));
    // Covers both the cancel button and Esc inside the view
    this.view.on('cancel', () => this.teardown());

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

    this.applyCropBtn.addEventListener('click', () => this.view.accept());
    this.cancelCropBtn.addEventListener('click', () => this.view.cancel());
  }

  get isActive(): boolean {
    return this.isSaving || this.view.state !== 'idle';
  }

  async start(imageElement: SVGImageElement): Promise<void> {
    if (this.isActive) return;
    this.imageToCrop = imageElement;
    this.updateCropperPosition();
    this.callbacks.showLoader();

    try {
      const imageFile = this.imageToCrop.getAttribute('href') as string;
      const blob = await fetch(imageFile).then((res) => res.blob());
      if (this.isDisposed) return;

      await this.view.start(blob);
      // Disposed mid-load: the view resolves without a session
      if (this.isDisposed) return;

      this.imageToCrop.style.visibility = 'hidden';
      this.cropperOuter.style.pointerEvents = 'auto';
      window.addEventListener('resize', this.boundUpdateCropperPosition);
    } catch (err) {
      this.imageToCrop.style.visibility = 'visible';
      this.cropperOuter.style.pointerEvents = 'none';

      console.log('Failed to init cropper tool:', err);
    } finally {
      this.callbacks.hideLoader();
    }
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

  private async applyCrop({ blob }: CropResult): Promise<void> {
    if (!this.imageToCrop) return;
    this.isSaving = true;

    const previousUrl = this.imageToCrop.getAttribute('href');
    this.imageToCrop.setAttribute('href', URL.createObjectURL(blob));
    if (previousUrl) URL.revokeObjectURL(previousUrl);

    try {
      await this.callbacks.saveImage(blob, this.callbacks.getCurrentMonthInViewIndex());
    } catch (err) {
      console.log('Failed to save cropped image:', err);
    } finally {
      this.isSaving = false;
      // Disposed mid-save: dispose() already tore down
      if (!this.isDisposed) this.teardown();
    }
  }

  private teardown(swapControlsBack = true): void {
    if (this.imageToCrop) this.imageToCrop.style.visibility = 'visible';
    this.cropperOuter.style.pointerEvents = 'none';
    window.removeEventListener('resize', this.boundUpdateCropperPosition);

    if (swapControlsBack) this.callbacks.onAfterRemove?.();
  }

  dispose() {
    if (this.isDisposed) return;
    // Controls are swapped only once a session is open, so only then swap them back
    const controlsSwapped = this.isSaving || this.view.state === 'cropping';
    this.isDisposed = true;

    this.teardown(controlsSwapped);
    this.view.destroy();
    this.cropperOuter.remove();
  }
}
