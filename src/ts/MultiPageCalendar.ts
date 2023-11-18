import { Calendar } from "./Calendar";
/**
 * Object with SVG icons
 */
import { icons } from "../assets/icons";

import {
  CalendarLanguage,
  CalendarType,
  FormatName,
  LoadingState,
  PDFPagesRangeToDownload,
} from "../../types.d";
import { createHTMLElement } from "./utils/createElement/createHTMLElement";
import { createSVGElement } from "./utils/createElement/createSVGElement";
import { A_FormatMultiPageMockupOptions } from "../assets/A_FormatOptions/A_FormatOptions";

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
    public format: FormatName
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
      format
    );

    MultiPageCalendar.current = this;
    this.weekDaysNamesList = this.getWeekDays("long");

    this.mockupOptions = new A_FormatMultiPageMockupOptions(format)[format];

    if (Calendar.isNewType) {
      MultiPageCalendar.createMultiPageControls(this.controlsContainer);
      MultiPageCalendar.initMultiPageControlsEvents();
    }

    this.createSVGMockup();
  }

  /**
   * @property {Function} createMultiPageControls - Creates controls of multi page calendar in DOM
   */
  static createMultiPageControls(controlsContainer: HTMLDivElement): void {
    this.allPDFDownloadBtn = createHTMLElement({
      elementName: "button",
      id: "pdf-download-all",
      content: icons.pdfMulti,
      insertTo: {
        element: controlsContainer,
        position: "afterbegin",
      },
    });

    this.prevBtn = createHTMLElement({
      elementName: "button",
      id: "prev-month",
      content: icons.prev,
      insertTo: {
        element: controlsContainer,
        position: "afterbegin",
      },
    });

    this.multipleImagesInput = createHTMLElement({
      elementName: "input",
      id: "upload-multiple-input",
      attributes: {
        type: "file",
        multiple: "multiple",
        hidden: new Boolean(true).toString(),
        accept: "image/jpeg, image/png, image/jpg",
        onclick: "this.value=null;",
      },
      insertTo: {
        element: controlsContainer,
        position: "beforeend",
      },
    });

    this.uploadMultipleImgsBtn = createHTMLElement({
      elementName: "label",
      id: "upload-multiple",
      content: icons.uploadMulti,
      attributes: {
        for: "upload-multiple-input",
      },
      insertTo: {
        element: controlsContainer,
        position: "beforeend",
      },
    });

    this.nextBtn = createHTMLElement({
      elementName: "button",
      id: "next-month",
      content: icons.next,
      insertTo: {
        element: controlsContainer,
        position: "beforeend",
      },
    });
  }

  /**
   * @property {Function} initMultiPageControlsEvents - Adds events listener to controls buttons
   * @returns {void}
   */
  static initMultiPageControlsEvents(): void {
    this.nextBtn.addEventListener("click", () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.current.currentMonth++;

      if (this.current.currentMonth > 11) {
        this.current.currentMonth = 0;
      }

      this.setVisibleMonth();
    });

    this.prevBtn.addEventListener("click", () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.current.currentMonth--;
      if (this.current.currentMonth < 0) {
        this.current.currentMonth = 11;
      }

      this.setVisibleMonth();
    });

    this.multipleImagesInput.addEventListener("change", (e) => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      this.uploadMultipleImages(e);
    });

    this.allPDFDownloadBtn.addEventListener("click", () => {
      if (Calendar.cropper) {
        Calendar.removeCropper();
      }

      Calendar.downloadPDF(PDFPagesRangeToDownload.All);
    });
  }

  /**
   * @property {Function} createSVGMockup - creates SVG mockup in DOM
   */
  createSVGMockup(): void {
    this.calendarWrapper = createHTMLElement({
      elementName: "div",
      className: "calendar-wrapper",
      parentToAppend: this.parentContainer,
    });

    this.calendarInner = createHTMLElement({
      elementName: "div",
      className: "calendar-inner",
      parentToAppend: this.calendarWrapper,
    });

    MultiPageCalendar.setVisibleMonth();

    // Create months templates
    for (let i = 0; i < 12; i++) {
      const monthContainer = createHTMLElement({
        elementName: "div",
        className: "month-container",
        id: `month-${i}-container`,
        parentToAppend: this.calendarInner,
        attributes: {
          ["data-month"]: this.monthCounter.toString(),
          ["data-year"]: this.year.toString(),
        },
      });

      const monthMockup = createSVGElement({
        elementName: "svg",
        parentToAppend: monthContainer,
        id: `mockup-${i}`,
        attributes: {
          viewBox: `0 0 ${this.mockupOptions.mockupWidth} ${this.mockupOptions.mockupHeight}`,
        },
      });

      const backgroundRect = createSVGElement({
        elementName: "rect",
        id: `background-rect-${i}`,
        parentToAppend: monthMockup,
        attributes: {
          width: this.mockupOptions.mockupWidth.toString(),
          height: this.mockupOptions.mockupHeight.toString(),
          style: `fill: ${this.mockupOptions.mockupBackgroundFill}`,
        },
      });

      const monthTextGroup = createSVGElement({
        elementName: "g",
        id: `days-grid-${i}`,
        parentToAppend: monthMockup,
      });

      const monthTextEl = createSVGElement({
        elementName: "g",
        id: `#month-title-${i}`,
        parentToAppend: monthTextGroup,
        content: this.getOutline(
          this.monthsNamesList[this.monthCounter],
          this.mockupOptions.monthTitleX,
          this.mockupOptions.monthTitleY,
          this.mockupOptions.monthTitleFontSize
        ),
      });

      const yearTextEl = createSVGElement({
        elementName: "g",
        id: `#year-title-${i}`,
        parentToAppend: monthTextGroup,
        content: this.getOutline(
          `${this.year}`,
          this.mockupOptions.yearTitleX,
          this.mockupOptions.yearTitleY,
          this.mockupOptions.yearTitleFontSize
        ),
      });

      const daysTitles = createSVGElement({
        elementName: "g",
        id: `days-titles-${i}`,
        parentToAppend: monthTextGroup,
      });

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        const weekDayCell = createSVGElement({
          elementName: "g",
          parentToAppend: daysTitles,
          children: [
            this.getAndPlaceOutline(
              weekDayName,
              this.mockupOptions.weekDayX,
              this.mockupOptions.weekDayY,
              this.mockupOptions.weekDayFontSize
            ),
          ],
          attributes: {
            transform: `translate(${
              this.mockupOptions.calendarGridX +
              this.mockupOptions.dayCellWidth * i
            } ${this.mockupOptions.weekDaysY})`,
          },
        });
      });

      const monthImageGroup = createSVGElement({
        elementName: "g",
        id: "image-group",
        parentToAppend: monthMockup,
      });

      const imagePlaceholderRect = createSVGElement({
        elementName: "rect",
        id: `image-placeholder-${i}`,
        parentToAppend: monthImageGroup,
        attributes: {
          width: this.mockupOptions.imagePlaceholderWidth.toString(),
          height: this.mockupOptions.imagePlaceholderHeight.toString(),
          x: this.mockupOptions.imagePlaceholderX.toString(),
          y: this.mockupOptions.imagePlaceholderY.toString(),
          style: "fill: #e8e8e8",
        },
      });

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
        this.getFirstDay(this.monthCounter - 1, this.year) - 1,
        this.daysInMonth(this.monthCounter, this.year),
        this.daysInMonth(this.monthCounter - 1, this.year),
        this.mockupOptions.calendarGridX,
        this.mockupOptions.calendarGridY,
        this.mockupOptions.daysFontSize,
        this.mockupOptions.dayCellStyles
      );

      this.pagesArray.push(monthMockup);
    }
  }

  /**
   * @property {Function} setVisibleMonth - show current month mockup in DOM by translate calendarInner container by X axis
   */
  static setVisibleMonth(): void {
    this.current.calendarInner.style.left = `-${
      this.current.currentMonth * 100
    }%`;
  }

  /**
   * @property {Function} uploadMultipleImages - upload multiple images in calendar
   * @param {e} e - Event Object object with files
   * @returns {void}
   */
  static uploadMultipleImages(e: Event): void {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      let files = [...e.target.files];
      let loadedFilesCounter = 0;

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const imageGroup = this.current.calendarInner.querySelector(
            `#month-${i}-container #image-group`
          ) as SVGGElement;

          imageGroup.innerHTML = "";

          const imageEl = createSVGElement({
            elementName: "image",
            parentToAppend: imageGroup,
            attributes: {
              height:
                this.current.mockupOptions.imagePlaceholderHeight.toString(),
              width:
                this.current.mockupOptions.imagePlaceholderWidth.toString(),
              x: this.current.mockupOptions.imagePlaceholderX.toString(),
              y: this.current.mockupOptions.imagePlaceholderY.toString(),
            },
          });

          // Image optimization
          const reduced = this.reduceImageSize(
            reader.result as string,
            this.current.mockupOptions.imagePlaceholderWidth *
              this.current.imageReduceSizeRate,
            this.current.mockupOptions.imagePlaceholderHeight *
              this.current.imageReduceSizeRate
          );

          reduced
            .then((reducedImage) => {
              const resultImage = reducedImage ? reducedImage : reader.result;

              this.current.saveToIDB(resultImage as string, i);

              imageEl.setAttributeNS(
                "http://www.w3.org/1999/xlink",
                "href",
                resultImage as string
              );

              loadedFilesCounter++;
            })
            .then(() => {
              if (
                loadedFilesCounter === files.length ||
                loadedFilesCounter === 11
              ) {
                Calendar.loading(LoadingState.Hide);
              }
            });
        };

        reader.readAsDataURL(files[i]);
        Calendar.loading(LoadingState.Show);

        if (i === 11) {
          break;
        }
      }
    }
  }

  /**
   * @property {Fucntion} retrieveImages - load images from given array to DOM
   * @param {Array} imagesArr - Array of images to load

   */
  async retrieveImages(imagesArr: ImageObject[]): Promise<void> {
    Calendar.loading(LoadingState.Show);

    if (imagesArr.length === 0) {
      Calendar.loading(LoadingState.Hide);
      return;
    }
    let loadingCounter = 0;

    imagesArr.forEach((imageItem) => {
      const currentMonthContainer = imageItem.id;

      fetch(imageItem.image).then((res) => {
        const imgURL = res.url;

        const imageGroup = document.querySelector(
          `#month-${currentMonthContainer}-container #image-group`
        ) as SVGGElement;
        imageGroup.innerHTML = "";

        const imageEl = createSVGElement({
          elementName: "image",
          parentToAppend: imageGroup,
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

        loadingCounter++;

        if (loadingCounter === imagesArr.length) {
          Calendar.loading(LoadingState.Hide);
        }
      });
    });
  }
}
