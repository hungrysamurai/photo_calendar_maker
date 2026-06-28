import { FormatName } from '../../types';
import { createSVGElement } from '../utils/DOM/createElement/createSVGElement';
import reduceImageSize from '../utils/reduceImage';
import MockupsCache from './MockupsCache/MockupsCache';

export type UploadManagerOptions = {
  cache: MockupsCache;
  format: FormatName;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;
  outputDimensions: OutputDimensions;
  getCurrentMonth: () => number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  getMockupByIndex: (index: number) => SVGElement;
  getImageGroupByIndex?: (index: number) => SVGGElement;
  saveImage: (resultUrl: string, id: number) => void;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class UploadManager {
  private imageReduceSizeRate = 11.8;

  constructor(private options: UploadManagerOptions) {}

  public async uploadSingleImage(e: Event): Promise<void> {
    if (!(e.target instanceof HTMLInputElement) || !e.target.files?.length) return;

    const file = e.target.files[0];
    const currentMonth = this.options.getCurrentMonth();
    const imageGroup = this.options.getCurrentMockup('#image-group') as SVGGElement;

    if (!imageGroup) return;

    this.options.showLoader();
    try {
      await this.processSingleFile(file, imageGroup, currentMonth);
    } finally {
      this.options.hideLoader();
    }
  }

  public async uploadMultipleImages(e: Event, maxFiles = 12): Promise<void> {
    if (!(e.target instanceof HTMLInputElement) || !e.target.files?.length) return;
    if (!this.options.getImageGroupByIndex) return;

    const files = Array.from(e.target.files).slice(0, maxFiles);

    this.options.showLoader();
    try {
      const tasks = files.map((file, index) => {
        const imageGroup = this.options.getImageGroupByIndex!(index);
        if (!imageGroup) return Promise.resolve();
        return this.processSingleFile(file, imageGroup, index);
      });

      await Promise.all(tasks);
    } finally {
      this.options.hideLoader();
    }
  }

  private async processSingleFile(
    file: File,
    imageGroup: SVGGElement,
    cacheIndex: number,
  ): Promise<void> {
    imageGroup.innerHTML = '';

    const imageEl = createSVGElement({
      elementName: 'image',
      parentToAppend: imageGroup,
      attributes: {
        height: this.options.mockupOptions.imagePlaceholderHeight.toString(),
        width: this.options.mockupOptions.imagePlaceholderWidth.toString(),
        x: this.options.mockupOptions.imagePlaceholderX.toString(),
        y: this.options.mockupOptions.imagePlaceholderY.toString(),
      },
    }) as SVGImageElement;

    const fileDataUrl = await this.readFile(file);

    const reduced = await reduceImageSize(
      fileDataUrl,
      this.options.mockupOptions.imagePlaceholderWidth * this.imageReduceSizeRate,
      this.options.mockupOptions.imagePlaceholderHeight * this.imageReduceSizeRate,
    );

    const resultImage = reduced ?? fileDataUrl;

    imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', resultImage);
    this.options.saveImage(resultImage, cacheIndex);

    await this.cacheMockup(cacheIndex);
  }

  private async cacheMockup(cacheIndex: number): Promise<void> {
    const mockup = this.options.getMockupByIndex(cacheIndex);

    await this.options.cache.cacheMockup(
      mockup,
      cacheIndex,
      this.options.outputDimensions[this.options.format].width,
      this.options.outputDimensions[this.options.format].height,
    );
  }

  private async readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader failed'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }
}
