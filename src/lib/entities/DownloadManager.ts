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
  font: FontData;
  getCurrentMonth: () => number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  showLoader: () => void;
  hideLoader: () => void;
};

/**
 * jsPDF advanced API (used by svg2pdf) miscalculates text baseline offsets for any unit
 * other than 'pt' (offset gets divided by the unit scale factor), so PDF is built in points
 * and mockup millimeters are converted here
 */
const MM_TO_PT = 72 / 25.4;

export default class DownloadManager {
  constructor(private options: DownloadManagerOptions) {}

  public async downloadCurrentJPG(): Promise<void> {
    this.options.showLoader();

    try {
      const monthIndex = this.options.getCurrentMonth();
      const { width, height } = this.options.outputDimensions[this.options.format];

      const pageClone = this.options.svgMockups[monthIndex].cloneNode(true) as SVGElement;

      // Detached blob-loaded SVG can't see page CSS - fonts must live inside the markup
      this.ensureFontFaceStyle(pageClone);

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

      const pageWidth = mockupWidth * MM_TO_PT;
      const pageHeight = mockupHeight * MM_TO_PT;

      const pdf = new jsPDF(mockupWidth > mockupHeight ? 'l' : 'p', 'pt', [pageWidth, pageHeight]);

      // svg2pdf resolves <text> font-family against fonts registered on this jsPDF instance
      this.registerFonts(pdf);

      for (let i = 0; i < pagesToDownload.length; i++) {
        const pageClone = pagesToDownload[i].cloneNode(true) as SVGElement;

        const imageEl = pageClone.querySelector('image');
        if (imageEl) {
          imageEl.remove();
        }

        this.resolveCenteredText(pageClone, pdf);

        await pdf.svg(pageClone, { x: 0, y: 0, width: pageWidth, height: pageHeight });

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
            offsetX * MM_TO_PT, // Centered X position
            offsetY * MM_TO_PT, // Centered Y position
            scaledWidth * MM_TO_PT,
            scaledHeight * MM_TO_PT,
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

  /**
   * Register both weights of selected font in jsPDF VFS so every page embeds them.
   * Throws if embeddable font data is missing - no silent fallback typeface in exports.
   */
  private registerFonts(pdf: jsPDF): void {
    const { font } = this.options;

    if (!font?.bold?.vfs || !font?.regular?.vfs) {
      throw new Error('Embeddable font data is missing');
    }

    for (const { family, fileName, base64 } of [font.bold.vfs, font.regular.vfs]) {
      pdf.addFileToVFS(fileName, base64);
      // <text> elements carry no font-weight, so svg2pdf looks up the 'normal' style
      pdf.addFont(fileName, family, 'normal');
    }
  }

  /**
   * svg2pdf resolves `text-anchor="middle"` by measuring strings in the browser at the SVG
   * font size - for single-page mockups that is ~1.5px, where glyph advances get rounded
   * and digits drift horizontally. Center from exact embedded font metrics instead.
   */
  private resolveCenteredText(svg: SVGElement, pdf: jsPDF): void {
    svg.querySelectorAll('text[text-anchor="middle"]').forEach((textEl) => {
      const family = textEl.getAttribute('font-family');
      const fontSize = Number(textEl.getAttribute('font-size'));
      const x = Number(textEl.getAttribute('x'));

      if (!family || !fontSize || Number.isNaN(x)) return;

      // Document is in 'pt' with scale factor 1, so width comes back in SVG user units
      pdf.setFont(family, 'normal');
      pdf.setFontSize(fontSize);
      const width = pdf.getTextWidth(textEl.textContent ?? '');

      textEl.setAttribute('x', `${x - width / 2}`);
      textEl.setAttribute('text-anchor', 'start');
    });
  }

  /**
   * Make sure SVG carries `@font-face` rules for both weights of selected font.
   * Throws if embeddable font data is missing - no silent fallback typeface in exports.
   */
  private ensureFontFaceStyle(svg: SVGElement): void {
    const { font } = this.options;

    if (!font?.bold?.fontFace || !font?.regular?.fontFace) {
      throw new Error('Embeddable font data is missing');
    }

    const rules = [font.bold.fontFace, font.regular.fontFace];

    const hasAllRules = Array.from(svg.querySelectorAll('style')).some((styleEl) =>
      rules.every((rule) => styleEl.textContent?.includes(rule)),
    );

    if (hasAllRules) return;

    svg.prepend(createSVGElement({ elementName: 'style', text: rules.join('\n') }));
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
