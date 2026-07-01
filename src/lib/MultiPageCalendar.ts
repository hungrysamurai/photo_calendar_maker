import { Calendar } from './Calendar';
/**
 * Object with SVG icons
 */

import { A_FormatMultiPageMockupOptions } from '../assets/A_FormatOptions/A_FormatOptions';
import { CalendarLanguage, CalendarType, FormatName, PDFPagesRangeToDownload } from '../types';
import { createHTMLElement } from './utils/DOM/createElement/createHTMLElement';
import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import getDaysInMonth from './utils/getDaysInMonth';
import getMonthFirstDay from './utils/getMonthFirstDay';
import getWeekDays from './utils/getWeekDays';
import saveImageIDB from './utils/IDB/saveImageIDB';

import { MultiPageControlsManager } from './entities/ControlsManager';
import DownloadManager from './entities/DownloadManager';
import UploadManager from './entities/UploadManager';
import saveCachedMockupIDB from './utils/IDB/saveCachedMockupIDB';
/**
 * Class that generates Multi Page Calendar (each month on separate SVG)
 */
export class MultiPageCalendar extends Calendar {
  mockupOptions: MultiPageMockupOutputOptions;

  constructor(
    public firstMonthIndex: number,
    public year: number,
    public parentContainer: HTMLDivElement,
    public controlsContainer: HTMLDivElement,
    public cropControlsContainer: HTMLDivElement,
    public lang: CalendarLanguage,
    public type: CalendarType,
    public currentFont: FontArray,
    public format: FormatName,
    public imagesFromIDB: ImageObject[] = [],
    public savedCachedMockups: CachedMockupObject[] = [],
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont,
      format,
    );

    this.controlsManager = new MultiPageControlsManager(this.controlsContainer, {
      onDownloadCurrentPdf: this.onDownloadCurrentPdf,
      onDownloadJpg: this.onDownloadJpg,
      onCrop: this.onCrop,
      onUploadImage: this.onUploadImage,
      onDownloadAllPdf: this.onDownloadAllPdf,
      onPrevMonth: this.onPrevMonth,
      onNextMonth: this.onNextMonth,
      onUploadMultipleImages: this.onUploadMultipleImages,
    });

    this.controlsManager.init();

    this.weekDaysNamesList = getWeekDays('long', this.lang);

    this.mockupOptions = new A_FormatMultiPageMockupOptions(format)[format];

    this.uploadManager = new UploadManager({
      cache: this.cache,
      format: this.format,
      mockupOptions: this.mockupOptions,
      outputDimensions: this.outputDimensions,
      getCurrentMonth: () => this.currentMonth,
      getCurrentMockup: this.getCurrentMockup.bind(this),
      getMockupByIndex: this.getMockupByIndex.bind(this),
      getImageGroupByIndex: (index) =>
        this.calendarInner.querySelector(`#month-${index}-container #image-group`) as SVGGElement,
      saveImage: (resultUrl, id) => saveImageIDB(resultUrl, id),
      showLoader: this.showLoader.bind(this),
      hideLoader: this.hideLoader.bind(this),
    });

    this.downloadManager = new DownloadManager({
      cache: this.cache,
      calendarType: this.type,
      calendarFirstMonth: this.firstMonth,
      calendarStartYear: this.startYear,
      calendarLastMonth: this.lastMonth,
      calendarEndYear: this.endYear,
      format: this.format,
      outputDimensions: this.outputDimensions,
      getCurrentMonth: () => this.currentMonth,
      getCurrentMockup: this.getCurrentMockup.bind(this),
      showLoader: this.showLoader.bind(this),
      hideLoader: this.hideLoader.bind(this),
    });

    this.createSVGMockup();
  }

  onDownloadAllPdf = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.downloadManager.downloadPDF(PDFPagesRangeToDownload.All);
  };

  onPrevMonth = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
    }

    this.setVisibleMonth();
  };

  onNextMonth = () => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }
    this.currentMonth++;

    if (this.currentMonth > 11) {
      this.currentMonth = 0;
    }

    this.setVisibleMonth();
  };

  onUploadMultipleImages = (e: Event) => {
    if (this.imageCropper.isActive) {
      this.imageCropper.removeCropper();
    }

    this.uploadManager.uploadMultipleImages(e);
  };

  /**
   * @property {Function} createSVGMockup - creates SVG mockup in DOM
   */
  async createSVGMockup(): Promise<void> {
    this.showLoader();

    const temp = [];

    this.calendarWrapper = createHTMLElement({
      elementName: 'div',
      className: 'calendar-wrapper',
      parentToAppend: this.parentContainer,
    });

    this.calendarInner = createHTMLElement({
      elementName: 'div',
      className: 'calendar-inner',
      parentToAppend: this.calendarWrapper,
    });

    this.setVisibleMonth();

    let monthCounter = this.firstMonthIndex;

    // Create months templates
    for (let i = 0; i < 12; i++) {
      const monthContainer = createHTMLElement({
        elementName: 'div',
        className: 'month-container',
        id: `month-${i}-container`,
        parentToAppend: this.calendarInner,
        attributes: {
          ['data-month']: monthCounter.toString(),
          ['data-year']: this.year.toString(),
        },
      });

      const monthMockup = createSVGElement({
        elementName: 'svg',
        parentToAppend: monthContainer,
        id: `mockup-${i}`,
        attributes: {
          viewBox: `0 0 ${this.mockupOptions.mockupWidth} ${this.mockupOptions.mockupHeight}`,
          width: this.outputDimensions[this.format].width.toString(),
          height: this.outputDimensions[this.format].height.toString(),
        },
      });

      createSVGElement({
        elementName: 'rect',
        id: `background-rect-${i}`,
        parentToAppend: monthMockup,
        attributes: {
          width: this.mockupOptions.mockupWidth.toString(),
          height: this.mockupOptions.mockupHeight.toString(),
          style: `fill: ${this.mockupOptions.mockupBackgroundFill}`,
        },
      });

      const monthTextGroup = createSVGElement({
        elementName: 'g',
        id: `days-grid-${i}`,
        parentToAppend: monthMockup,
      });

      createSVGElement({
        elementName: 'g',
        id: `#month-title-${i}`,
        parentToAppend: monthTextGroup,
        content: this.getOutline(
          this.monthsNamesList[monthCounter],
          this.mockupOptions.monthTitleX,
          this.mockupOptions.monthTitleY,
          this.mockupOptions.monthTitleFontSize,
        ),
      });

      createSVGElement({
        elementName: 'g',
        id: `#year-title-${i}`,
        parentToAppend: monthTextGroup,
        content: this.getOutline(
          `${this.year}`,
          this.mockupOptions.yearTitleX,
          this.mockupOptions.yearTitleY,
          this.mockupOptions.yearTitleFontSize,
        ),
      });

      const daysTitles = createSVGElement({
        elementName: 'g',
        id: `days-titles-${i}`,
        parentToAppend: monthTextGroup,
      });

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          children: [
            this.getAndPlaceOutline(
              weekDayName,
              this.mockupOptions.weekDayX,
              this.mockupOptions.weekDayY,
              this.mockupOptions.weekDayFontSize,
            ),
          ],
          attributes: {
            transform: `translate(
            ${this.mockupOptions.calendarGridX + this.mockupOptions.dayCellWidth * i} ${this.mockupOptions.weekDaysY})`,
          },
        });
      });

      const monthImageGroup = createSVGElement({
        elementName: 'g',
        id: 'image-group',
        parentToAppend: monthMockup,
      });

      // Check if current month have a corresponding saved in IDB image
      const imageInIDB = this.imagesFromIDB.find((el) => el.id === i);

      if (imageInIDB) {
        // ...fetch stored image and place it on mockup
        const imageObject = await fetch(imageInIDB.image);
        const imgURL = imageObject.url;

        createSVGElement({
          elementName: 'image',
          parentToAppend: monthImageGroup,
          attributes: {
            height: this.mockupOptions.imagePlaceholderHeight.toString(),
            width: this.mockupOptions.imagePlaceholderWidth.toString(),
            x: this.mockupOptions.imagePlaceholderX.toString(),
            y: this.mockupOptions.imagePlaceholderY.toString(),
          },
          attributesNS: {
            href: imgURL,
          },
        });
      } else {
        // if no saved image - just put placeholder
        createSVGElement({
          elementName: 'rect',
          id: `image-placeholder-${i}`,
          parentToAppend: monthImageGroup,
          attributes: {
            width: this.mockupOptions.imagePlaceholderWidth.toString(),
            height: this.mockupOptions.imagePlaceholderHeight.toString(),
            x: this.mockupOptions.imagePlaceholderX.toString(),
            y: this.mockupOptions.imagePlaceholderY.toString(),
            style: 'fill: #e8e8e8',
          },
        });
      }

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        this.year++;
      }

      this.createMonthGrid(
        monthTextGroup,
        getMonthFirstDay(monthCounter - 1, this.year) - 1,
        getDaysInMonth(monthCounter, this.year),
        getDaysInMonth(monthCounter - 1, this.year),
        this.mockupOptions.calendarGridX,
        this.mockupOptions.calendarGridY,
        this.mockupOptions.daysFontSize,
        this.mockupOptions.dayCellStyles,
      );

      const mockupInIDB = this.savedCachedMockups.find((el) => el.id === i);

      if (mockupInIDB) {
        this.cache.setRetrievedMockup(i, mockupInIDB.mockup);
      } else {
        temp.push(
          this.cache.cacheMockup(
            monthMockup,
            i,
            this.outputDimensions[this.format].width,
            this.outputDimensions[this.format].height,
          ),
        );
      }
    }

    (await Promise.all(temp)).forEach((p, i) => {
      saveCachedMockupIDB(p, i);
    });

    this.hideLoader();
  }

  /**
   * @property {Function} setVisibleMonth - show current month mockup in DOM by translate calendarInner container by X axis
   */
  setVisibleMonth(): void {
    this.calendarInner.style.transform = `translateX(calc(-8.333333% * ${this.currentMonth}))`;
  }
}
