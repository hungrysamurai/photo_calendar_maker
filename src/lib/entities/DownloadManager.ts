import { CalendarType } from '../../types';
import MockupsCache from './MockupsCache/MockupsCache';

export type DownloadManagerOptions = {
  cache: MockupsCache;
  calendarType: CalendarType;
  calendarFirstMonth: number;
  calendarStartYear: number;
  calendarLastMonth: number;
  calendarEndYear: number;
  getCurrentMockup: (element?: string) => SVGElement | SVGImageElement;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class DownloadManager {
  constructor(private options: DownloadManagerOptions) {}

  public downloadCurrentJPG(monthIndex: number): void {
    const url = URL.createObjectURL(this.options.cache.cachedMockups[monthIndex]);
    const fileName = this.getFileName();

    this.downloadElement(url, fileName);
  }

  public async downloadPDF() {}

  private getFileName(span?: boolean): string {
    if (span || this.options.calendarType === CalendarType.SinglePage) {
      const firstMonth = this.options.calendarFirstMonth;
      const firstMonthYear = this.options.calendarStartYear;

      const date1 = new Date(Number(firstMonthYear), Number(firstMonth));
      const firstMonthName = date1.toLocaleString('default', { month: 'long' });

      const lastMonth = this.lastMonth;
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
