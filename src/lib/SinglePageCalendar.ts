import { Calendar } from "./Calendar";

import { createHTMLElement } from "./utils/createElement/createHTMLElement";
import { createSVGElement } from "./utils/createElement/createSVGElement";

import {
  CalendarLanguage,
  CalendarType,
  FormatName,
  LoadingState,
} from "../../types";

import { A_FormatSinglePageMockupOptions } from "../assets/A_FormatOptions/A_FormatOptions";

/**
 * Class that generates Single Page Calendar (all months on one page)
 */
export class SinglePageCalendar extends Calendar {
  mockupOptions: SinglePageMockupOutputOptions;

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
    public imagesFromIDB: ImageObject[] = []
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

    this.mockupOptions = new A_FormatSinglePageMockupOptions(format)[format];

    this.weekDaysNamesList = this.getWeekDays("short");

    this.createSVGMockup();
  }

  /**
   * @async
   * @property {Function} createSVGMockup - creates SVG mockup in DOM
   */
  async createSVGMockup(): Promise<void> {
    Calendar.loading(LoadingState.Show);

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

    const mockup = createSVGElement({
      elementName: "svg",
      id: "mockup",
      attributes: {
        viewBox: `0 0 ${this.mockupOptions.mockupWidth} ${this.mockupOptions.mockupHeight}`,
        width: Calendar.outputDimensions[this.format].width.toString(),
        height: Calendar.outputDimensions[this.format].height.toString(),
      },
    });

    const backgroundRect = createSVGElement({
      elementName: "rect",
      id: "background-rect",
      parentToAppend: mockup,
      attributes: {
        width: this.mockupOptions.mockupWidth.toString(),
        height: this.mockupOptions.mockupHeight.toString(),
        style: `fill: ${this.mockupOptions.mockupBackgroundFill}`,
      },
    });

    this.imageElementGroup = createSVGElement({
      elementName: "g",
      id: "image-group",
      parentToAppend: mockup,
    });

    const imageInIDB: ImageObject | undefined = this.imagesFromIDB[0];

    if (imageInIDB) {
      const imageObject = await fetch(imageInIDB.image);
      const imgURL = imageObject.url;

      const imageEl = createSVGElement({
        elementName: "image",
        parentToAppend: this.imageElementGroup,
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
      const imagePlaceholderRect = createSVGElement({
        elementName: "rect",
        id: "image-placeholder",
        parentToAppend: this.imageElementGroup,
        attributes: {
          x: this.mockupOptions.imagePlaceholderX.toString(),
          y: this.mockupOptions.imagePlaceholderY.toString(),
          width: this.mockupOptions.imagePlaceholderWidth.toString(),
          height: this.mockupOptions.imagePlaceholderHeight.toString(),
          style: "fill: #e8e8e8",
        },
      });
    }

    const mockupContainer = createHTMLElement({
      elementName: "div",
      id: "mockup-container",
      parentToAppend: this.calendarInner,
      children: [mockup],
    });

    let x = this.mockupOptions.calendarGridLeftIndent;
    let y = this.mockupOptions.calendarGridTopIndent;

    // Global loop
    for (let i = 0; i < 12; i++) {
      // if new row...
      if (i % this.mockupOptions.numberOfColumns === 0) {
        // Increment y-movement
        y +=
          this.mockupOptions.monthCellHeight +
          this.mockupOptions.monthCellPadding;
        x = this.mockupOptions.calendarGridLeftIndent;
      }

      // Create month container
      const monthContainer = createSVGElement({
        elementName: "svg",
        id: `month-container-${i}`,
        attributes: {
          x: x.toString(),
          y: y.toString(),
          width: this.mockupOptions.monthCellWidth.toString(),
          height: this.mockupOptions.monthCellHeight.toString(),
          ["data-month"]: this.monthCounter.toString(),
          ["data-year"]: this.year.toString(),
        },
      });

      // Increment x-movement
      x +=
        this.mockupOptions.monthCellWidth + this.mockupOptions.monthCellPadding;

      const monthTitle = createSVGElement({
        elementName: "g",
        id: "month-title",
        parentToAppend: monthContainer,
        content: this.getOutline(
          this.monthsNamesList[this.monthCounter],
          this.mockupOptions.monthTitleX,
          this.mockupOptions.monthTitleY,
          this.mockupOptions.monthTitleFontSize
        ),
      });

      const yearTitle = createSVGElement({
        elementName: "g",
        id: "year-title",
        parentToAppend: monthContainer,
        content: this.getOutline(
          `${this.year}`,
          this.mockupOptions.yearTitleX,
          this.mockupOptions.yearTitleY,
          this.mockupOptions.yearTitleFontSize
        ),
      });

      const daysTitles = createSVGElement({
        elementName: "g",
        id: "week-days-titles",
        parentToAppend: monthContainer,
      });

      const currentMonthGrid = createSVGElement({
        elementName: "g",
        id: "days-grid",
        parentToAppend: monthContainer,
      });

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        // исключение для 'Cр'
        let descenderException = i === 2 && this.lang === "ru" ? true : false;

        const weekDayPath = this.getAndPlaceOutline(
          weekDayName,
          this.mockupOptions.weekDayX,
          descenderException
            ? this.mockupOptions.descenderException
            : this.mockupOptions.weekDayY,
          this.mockupOptions.weekDayFontSize
        );

        const weekDayCell = createSVGElement({
          elementName: "g",
          parentToAppend: daysTitles,
          attributes: {
            transform: `translate(${Number(
              this.mockupOptions.calendarGridX +
                this.mockupOptions.dayCellWidth * i
            ).toFixed(2)} 0)`,
          },
          children: [weekDayPath],
        });
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
        currentMonthGrid,
        this.getFirstDay(this.monthCounter - 1, this.year) - 1,
        this.daysInMonth(this.monthCounter, this.year),
        this.daysInMonth(this.monthCounter - 1, this.year) - 1,
        this.mockupOptions.calendarGridX,
        this.mockupOptions.calendarGridY,
        this.mockupOptions.daysFontSize,
        this.mockupOptions.dayCellStyles
      );

      // Append to main SVG
      mockup.appendChild(monthContainer);
    }

    this.cache.cacheMockup(
      Calendar.getCurrentMockup("svg"),
      0,
      Calendar.outputDimensions[this.format].width,
      Calendar.outputDimensions[this.format].height
    );

    Calendar.loading(LoadingState.Hide);
  }
}
