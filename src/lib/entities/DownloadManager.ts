import { CalendarType, FormatName, PDFPagesRangeToDownload } from '../../types';
import MockupsCache from './MockupsCache/MockupsCache';

export type DownloadManagerOptions = {
  cache: MockupsCache;
  calendarType: CalendarType;
  calendarFirstMonth: number;
  calendarStartYear: number;
  calendarLastMonth: number;
  calendarEndYear: number;
  format: FormatName;
  outputDimensions: OutputDimensions;
  getCurrentMonth: () => number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class DownloadManager {
  constructor(private options: DownloadManagerOptions) {}

  public downloadCurrentJPG(): void {
    const monthIndex = this.options.getCurrentMonth();
    const url = URL.createObjectURL(this.options.cache.cachedMockups[monthIndex]);
    const fileName = this.getFileName();

    this.downloadElement(url, fileName);
  }

  public async downloadPDF(range: PDFPagesRangeToDownload): Promise<void> {
    this.options.showLoader();

    const { PDFDocument } = await import('pdf-lib');
    const pdf = await PDFDocument.create();

    const monthIndex = this.options.getCurrentMonth();

    const pagesToDownload =
      range === PDFPagesRangeToDownload.All
        ? this.options.cache.cachedMockups
        : [this.options.cache.cachedMockups[monthIndex]];

    for (const blob of pagesToDownload) {
      const arrayBuffer = await blob.arrayBuffer();

      const image = await pdf.embedJpg(arrayBuffer);
      const page = pdf.addPage([
        this.options.outputDimensions[this.options.format].width,
        this.options.outputDimensions[this.options.format].height,
      ]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: this.options.outputDimensions[this.options.format].width,
        height: this.options.outputDimensions[this.options.format].height,
      });
    }

    const arrayBuffer = (await pdf.save()) as Uint8Array<ArrayBuffer>;

    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobURL = URL.createObjectURL(blob);

    const fileName = this.getFileName(range === PDFPagesRangeToDownload.All);

    this.downloadElement(blobURL, fileName);

    this.options.hideLoader();
    URL.revokeObjectURL(blobURL);
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
