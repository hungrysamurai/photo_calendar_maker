import { Calendar } from './Calendar';
/**
 * Object with SVG icons
 */
import { icons } from '../assets/icons';

import { A_FormatMultiPageMockupOptions } from '../assets/A_FormatOptions/A_FormatOptions';
import {
  CalendarLanguage,
  CalendarType,
  FormatName,
  LoadingState,
  PDFPagesRangeToDownload,
} from '../types';
import { createHTMLElement } from './utils/DOM/createElement/createHTMLElement';
import { createSVGElement } from './utils/DOM/createElement/createSVGElement';
import getDaysInMonth from './utils/getDaysInMonth';
import getMonthFirstDay from './utils/getMonthFirstDay';
import getWeekDays from './utils/getWeekDays';

/**
 * Class that generates Multi Page Calendar (each month on separate SVG)
 */
export class MultiPageCalendar extends Calendar {
  static _currentCalendar: MultiPageCalendar;

  static get current(): MultiPageCalendar {
    return MultiPageCalendar._currentCalendar;
  }

  static set current(calendar: MultiPageCalendar) {
    MultiPageCalendar._currentCalendar = calendar;
  }

  // Multi-page controls
  static prevBtn: HTMLButtonElement;
  static nextBtn: HTMLButtonElement;
  static allPDFDownloadBtn: HTMLButtonElement;
  static multipleImagesInput: HTMLInputElement;
  static uploadMultipleImgsBtn: HTMLLabelElement;

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

    MultiPageCalendar.current = this;
    this.weekDaysNamesList = getWeekDays('long', this.lang);

    this.mockupOptions = new A_FormatMultiPageMockupOptions(format)[format];

    if (Calendar.isNewType) {
      MultiPageCalendar.createMultiPageControls(this.controlsContainer);
      MultiPageCalendar.initMultiPageControlsEvents();
    }

    this.initCacheEventsForMultiPage();
    this.createSVGMockup();
  }

  /**
   * @property {Function} createMultiPageControls - Creates controls of multi page calendar in DOM
   */
  static createMultiPageControls(controlsContainer: HTMLDivElement): void {
    this.allPDFDownloadBtn = createHTMLElement({
      elementName: 'button',
      id: 'pdf-download-all',
      content: icons.pdfMulti,
      insertTo: {
        element: controlsContainer,
        position: 'afterbegin',
      },
    });

    this.prevBtn = createHTMLElement({
      elementName: 'button',
      id: 'prev-month',
      content: icons.prev,
      insertTo: {
        element: controlsContainer,
        position: 'afterbegin',
      },
    });

    this.multipleImagesInput = createHTMLElement({
      elementName: 'input',
      id: 'upload-multiple-input',
      attributes: {
        type: 'file',
        multiple: 'multiple',
        hidden: new Boolean(true).toString(),
        accept: 'image/jpeg, image/png, image/jpg',
        onclick: 'this.value=null;',
      },
      insertTo: {
        element: controlsContainer,
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
        element: controlsContainer,
        position: 'beforeend',
      },
    });

    this.nextBtn = createHTMLElement({
      elementName: 'button',
      id: 'next-month',
      content: icons.next,
      insertTo: {
        element: controlsContainer,
        position: 'beforeend',
      },
    });
  }

  /**
   * @property {Function} initMultiPageControlsEvents - Adds events listener to controls buttons
   * @returns {void}
   */
  static initMultiPageControlsEvents(): void {
    this.nextBtn.addEventListener('click', () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.current.currentMonth++;

      if (this.current.currentMonth > 11) {
        this.current.currentMonth = 0;
      }

      this.setVisibleMonth();
    });

    this.prevBtn.addEventListener('click', () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.current.currentMonth--;
      if (this.current.currentMonth < 0) {
        this.current.currentMonth = 11;
      }

      this.setVisibleMonth();
    });

    this.multipleImagesInput.addEventListener('change', (e) => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.uploadMultipleImages(e);
    });

    this.allPDFDownloadBtn.addEventListener('click', () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      Calendar.downloadPDF(PDFPagesRangeToDownload.All);
    });
  }

  initCacheEventsForMultiPage() {
    this.cache.addEventListener('workStart', () => {
      MultiPageCalendar.allPDFDownloadBtn.disabled = true;
      MultiPageCalendar.multipleImagesInput.disabled = true;
    });

    this.cache.addEventListener('workDone', () => {
      MultiPageCalendar.allPDFDownloadBtn.disabled = false;
      MultiPageCalendar.multipleImagesInput.disabled = false;
    });
  }

  /**
   * @property {Function} createSVGMockup - creates SVG mockup in DOM
   */
  async createSVGMockup(): Promise<void> {
    Calendar.loading(LoadingState.Show);

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

    MultiPageCalendar.setVisibleMonth();

    // Create months templates
    for (let i = 0; i < 12; i++) {
      const monthContainer = createHTMLElement({
        elementName: 'div',
        className: 'month-container',
        id: `month-${i}-container`,
        parentToAppend: this.calendarInner,
        attributes: {
          ['data-month']: this.monthCounter.toString(),
          ['data-year']: this.year.toString(),
        },
      });

      const monthMockup = createSVGElement({
        elementName: 'svg',
        parentToAppend: monthContainer,
        id: `mockup-${i}`,
        attributes: {
          viewBox: `0 0 ${this.mockupOptions.mockupWidth} ${this.mockupOptions.mockupHeight}`,
          width: Calendar.outputDimensions[this.format].width.toString(),
          height: Calendar.outputDimensions[this.format].height.toString(),
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
          this.monthsNamesList[this.monthCounter],
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

      if (i === 11) {
        this.lastMonth = this.monthCounter;
        this.endYear = this.year;
      }

      this.monthCounter++;

      if (this.monthCounter > 11) {
        this.monthCounter = 0;
        this.year++;
      }

      this.createMonthGrid(
        monthTextGroup,
        getMonthFirstDay(this.monthCounter - 1, this.year) - 1,
        getDaysInMonth(this.monthCounter, this.year),
        getDaysInMonth(this.monthCounter - 1, this.year),
        this.mockupOptions.calendarGridX,
        this.mockupOptions.calendarGridY,
        this.mockupOptions.daysFontSize,
        this.mockupOptions.dayCellStyles,
      );

      this.cache.cacheMockup(
        monthMockup,
        i,
        Calendar.outputDimensions[this.format].width,
        Calendar.outputDimensions[this.format].height,
      );
    }

    Calendar.loading(LoadingState.Hide);
  }

  /**
   * @property {Function} setVisibleMonth - show current month mockup in DOM by translate calendarInner container by X axis
   */
  static setVisibleMonth(): void {
    this.current.calendarInner.style.transform = `translateX(calc(-8.333333% * ${this.current.currentMonth}))`;
  }

  /**
   * @property {Function} uploadMultipleImages - upload multiple images in calendar
   * @param {e} e - Event Object object with files
   * @returns {void}
   */
  static async uploadMultipleImages(e: Event): Promise<void> {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const files = [...e.target.files];
      let loadedFilesCounter = 0;

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();

        Calendar.loading(LoadingState.Show);

        reader.readAsDataURL(files[i]);
        reader.onload = async () => {
          const imageGroup = this.current.calendarInner.querySelector(
            `#month-${i}-container #image-group`,
          ) as SVGGElement;

          imageGroup.innerHTML = '';

          const imageEl = createSVGElement({
            elementName: 'image',
            parentToAppend: imageGroup,
            attributes: {
              height: this.current.mockupOptions.imagePlaceholderHeight.toString(),
              width: this.current.mockupOptions.imagePlaceholderWidth.toString(),
              x: this.current.mockupOptions.imagePlaceholderX.toString(),
              y: this.current.mockupOptions.imagePlaceholderY.toString(),
            },
          });

          // Image optimization
          const reduced = await Calendar.reduceImageSize(
            reader.result as string,
            this.current.mockupOptions.imagePlaceholderWidth * this.current.imageReduceSizeRate,
            this.current.mockupOptions.imagePlaceholderHeight * this.current.imageReduceSizeRate,
          );

          const resultImage = reduced ? reduced : reader.result;

          this.current.saveToIDB(resultImage as string, i);

          imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', resultImage as string);

          this.current.cache.cacheMockup(
            Calendar.getMockupByIndex(i),
            i,
            Calendar.outputDimensions[this.current.format].width,
            Calendar.outputDimensions[this.current.format].height,
          );

          loadedFilesCounter++;

          if (loadedFilesCounter === files.length || loadedFilesCounter === 11) {
            Calendar.loading(LoadingState.Hide);
          }
        };

        if (i === 11) {
          break;
        }
      }
    }
  }
}
