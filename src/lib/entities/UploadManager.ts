import { FormatName } from '../../types';
import { createSVGElement } from '../utils/DOM/createElement/createSVGElement';
import checkAndShrinkImage from '../utils/checkAndShrinkImage';

export type UploadManagerOptions = {
  format: FormatName;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;
  outputDimensions: OutputDimensions;
  getCurrentMonthInViewIndex: () => number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  getMockupByIndex: (index: number) => SVGElement;
  getImageGroupByIndex?: (index: number) => SVGGElement;
  saveImage: (image: Blob, index: number) => Promise<void>;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class UploadManager {
  private imageReduceSizeRate = 11.8;

  constructor(private options: UploadManagerOptions) {}

  public async uploadSingleImage(e: Event): Promise<void> {
    if (!(e.target instanceof HTMLInputElement) || !e.target.files?.length) return;

    const file = e.target.files[0];
    const currentMonth = this.options.getCurrentMonthInViewIndex();
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
    mockupIndex: number,
  ): Promise<void> {
    try {
      const resultImage = await checkAndShrinkImage(
        file,
        this.options.mockupOptions.imagePlaceholderWidth * this.imageReduceSizeRate,
        this.options.mockupOptions.imagePlaceholderHeight * this.imageReduceSizeRate,
      );

      if (resultImage) {
        // Clean Up
        const prevImageLink = imageGroup.querySelector('image')?.href.baseVal;
        if (prevImageLink) URL.revokeObjectURL(prevImageLink);

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

        imageEl.setAttributeNS(
          'http://www.w3.org/1999/xlink',
          'href',
          URL.createObjectURL(resultImage),
        );

        await this.options.saveImage(resultImage, mockupIndex);
      } else {
        throw new Error('Failed to parse file');
      }
    } catch (err) {
      console.log(err);
    }
  }
}
