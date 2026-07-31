import { CalendarType, FormatName, PDFPagesRangeToDownload } from '../../types';

import jsPDF from 'jspdf';
import 'svg2pdf.js';
import getImageSize from '../utils/getImageSize';
import getImageDimensionsAndPlacement from '../utils/getImageDimensionsAndPlacement';
import SVGToCanvasBlob from '../utils/SVGToCanvasBlob';
import { createSVGElement } from '../utils/DOM/createElement/createSVGElement';
import readFile from '../utils/readFile';

export type DownloadManagerOptions = {
  calendarType: CalendarType;
  calendarFirstMonth: number;
  calendarStartYear: number;
  calendarLastMonth: number;
  calendarEndYear: number;
  format: FormatName;
  outputDimensions: OutputDimensions;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;
  svgMockups: SVGElement[];
  storedImages: StoredImage[];
  getCurrentMonth: () => number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class DownloadManager {
  constructor(private options: DownloadManagerOptions) {}

  public async downloadCurrentJPG(): Promise<void> {
    this.options.showLoader();

    try {
      const monthIndex = this.options.getCurrentMonth();
      const { width, height } = this.options.outputDimensions[this.options.format];

      const pageClone = this.options.svgMockups[monthIndex].cloneNode(true) as SVGElement;
      const imageEl = pageClone.querySelector('image');

      if (imageEl) {
        // Get imageGroup of image element
        const imageGroup = imageEl.parentElement as unknown as SVGGElement;
        // Cut out image el
        imageEl.remove();

        // Re-create image element
        const newImageEl = createSVGElement({
          elementName: 'image',
          parentToAppend: imageGroup,
          attributes: {
            height: this.options.mockupOptions.imagePlaceholderHeight.toString(),
            width: this.options.mockupOptions.imagePlaceholderWidth.toString(),
            x: this.options.mockupOptions.imagePlaceholderX.toString(),
            y: this.options.mockupOptions.imagePlaceholderY.toString(),
          },
        }) as SVGImageElement;

        const imageBlob = this.options.storedImages.find((el) => el.id === monthIndex);

        if (imageBlob) {
          const imageDataUrl = await readFile(imageBlob.image);

          // Embed base64 to image
          newImageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageDataUrl);
        }
      }

      const imageBlob = await SVGToCanvasBlob(pageClone, width, height);

      const imageUrl = URL.createObjectURL(imageBlob);
      const fileName = this.getFileName();

      this.downloadElement(imageUrl, fileName);
    } catch (err) {
      console.log('Failed to download image:', err);
    } finally {
      this.options.hideLoader();
    }
  }

  public async downloadPDF(range: PDFPagesRangeToDownload) {
    this.options.showLoader();

    try {
      const {
        mockupWidth,
        mockupHeight,
        imagePlaceholderHeight,
        imagePlaceholderWidth,
        imagePlaceholderX,
        imagePlaceholderY,
      } = this.options.mockupOptions;

      const monthIndex = this.options.getCurrentMonth();

      const pagesToDownload =
        range === PDFPagesRangeToDownload.All
          ? this.options.svgMockups
          : [this.options.svgMockups[monthIndex]];

      const pdf = new jsPDF(mockupWidth > mockupHeight ? 'l' : 'p', 'mm', [
        mockupWidth,
        mockupHeight,
      ]);

      for (let i = 0; i < pagesToDownload.length; i++) {
        const pageClone = pagesToDownload[i].cloneNode(true) as SVGElement;

        const imageEl = pageClone.querySelector('image');
        if (imageEl) {
          imageEl.remove();
        }

        await pdf.svg(pageClone, { x: 0, y: 0, width: mockupWidth, height: mockupHeight });

        // If download individual page - find image by index of SVG, else - proceed in sequence
        const imageIndex = range === PDFPagesRangeToDownload.All ? i : monthIndex;

        const imageBlob = this.options.storedImages.find((el) => el.id === imageIndex);

        if (imageBlob) {
          const arrayBuffer = await imageBlob.image.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const { width: imgWidth, height: imgHeight } = await getImageSize(imageBlob.image);
          const { offsetX, offsetY, scaledWidth, scaledHeight } = getImageDimensionsAndPlacement(
            imagePlaceholderWidth,
            imagePlaceholderHeight,
            imagePlaceholderX,
            imagePlaceholderY,
            imgWidth,
            imgHeight,
          );

          pdf.addImage(
            uint8Array,
            'JPEG',
            offsetX, // Centered X position
            offsetY, // Centered Y position
            scaledWidth,
            scaledHeight,
          );
        }

        if (i !== pagesToDownload.length - 1) pdf.addPage();
      }
      pdf.save(this.getFileName(range === PDFPagesRangeToDownload.All));
    } catch (err) {
      console.log('Failed to download PDF:', err);
    } finally {
      this.options.hideLoader();
    }
  }

  private getFileName(span?: boolean): string {
    if (span || this.options.calendarType === CalendarType.SinglePage) {
      const firstMonth = this.options.calendarFirstMonth;
      const firstMonthYear = this.options.calendarStartYear;

      const date1 = new Date(Number(firstMonthYear), Number(firstMonth));
      const firstMonthName = date1.toLocaleString('default', { month: 'long' });

      const lastMonth = this.options.calendarLastMonth;
      const lastMonthYear = this.options.calendarEndYear;

      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString('default', {
        month: 'long',
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear}`;
    }

    const currentMonthContainer = this.options.getCurrentMockup();

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(Number(year), Number(month));
    const monthName = date.toLocaleString('default', { month: 'long' });

    return `${monthName}_${year}`;
  }

  private downloadElement(elementURL: string, fileName: string): void {
    const a = document.createElement('a');
    a.download = fileName;
    a.href = elementURL;
    a.click();
    a.remove();
  }
}
