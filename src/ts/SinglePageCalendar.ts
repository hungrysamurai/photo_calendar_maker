import { Calendar } from "./Calendar";

import { createHTMLElement } from "./utils/createElement/createHTMLElement";
import { createSVGElement } from "./utils/createElement/createSVGElement";

import { CalendarLanguage, CalendarType } from "../../types";
/**
 * Class that generates Single Page Calendar (all months on one page)
 */
export class SinglePageCalendar extends Calendar {
  monthCellPadding: number;
  monthCellHeight: number;
  monthCellWidth: number;

  constructor(
    public firstMonthIndex: number,
    public year: number,
    public parentContainer: HTMLDivElement,
    public controlsContainer: HTMLDivElement,
    public cropControlsContainer: HTMLDivElement,
    public lang: CalendarLanguage,
    public type: CalendarType,
    public currentFont: FontArray
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont
    );

    this.weekDaysNamesList = this.getWeekDays("short");

    this.mockupHeight = Number(
      (Calendar.outputDimensions[Calendar.currentSize].height / 11.8).toFixed()
    );

    this.mockupWidth = Number(
      (Calendar.outputDimensions[Calendar.currentSize].width / 11.8).toFixed()
    );

    // Mockup pre-defined dimensions
    this.dayCellHeight = 4.435;
    this.dayCellWidth = 6.549;

    this.calendarGridX = 0;
    this.calendarGridY = 8.642;
    this.daysFontSize = 3.3;

    this.monthCellHeight = 37.5;
    this.monthCellWidth = 45.722;
    this.monthCellPadding = 2.3;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    this.calendarGridLeftIndent = 10;
    this.calendarGridTopIndent = 170;

    this.monthTitleX = 5;
    this.monthTitleY = 3.5;
    this.monthTitleWeight = 4;

    this.yearTitleX = 30;
    this.yearTitleY = 3.5;
    this.yearTitleWeigth = 4;

    this.createSVGMockup();
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

    const mockup = createSVGElement({
      elementName: "svg",
      id: "mockup",
      attributes: {
        viewBox: `0 0 ${this.mockupWidth} ${this.mockupHeight}`,
      },
    });

    const backgroundRect = createSVGElement({
      elementName: "rect",
      id: "background-rect",
      parentToAppend: mockup,
      attributes: {
        width: this.mockupWidth.toString(),
        height: this.mockupHeight.toString(),
        style: "fill: #fff",
      },
    });

    this.imageElementGroup = createSVGElement({
      elementName: "g",
      id: "image-group",
      parentToAppend: mockup,
    });

    const imagePlaceholderRect = createSVGElement({
      elementName: "rect",
      id: "image-placeholder",
      parentToAppend: this.imageElementGroup,
      attributes: {
        x: this.imagePlaceholderX.toString(),
        y: this.imagePlaceholderX.toString(),
        width: this.imagePlaceholderWidth.toString(),
        height: this.imagePlaceholderHeight.toString(),
        style: "fill: #e8e8e8",
      },
    });

    const mockupContainer = createHTMLElement({
      elementName: "div",
      id: "mockup-container",
      parentToAppend: this.calendarInner,
      children: [mockup],
    });

    let x = this.calendarGridLeftIndent;
    let y = this.calendarGridTopIndent;

    // Global loop
    for (let i = 0; i < 12; i++) {
      // if new row...
      if (i === 4 || i === 8) {
        // Increment y-movement
        y += this.monthCellHeight + this.monthCellPadding;
        x = this.calendarGridLeftIndent;
      }

      // Create month container
      const monthContainer = createSVGElement({
        elementName: "svg",
        id: `month-container-${i}`,
        attributes: {
          x: x.toString(),
          y: y.toString(),
          width: this.monthCellWidth.toString(),
          height: this.monthCellHeight.toString(),
          ["data-month"]: this.monthCounter.toString(),
          ["data-year"]: this.year.toString(),
        },
      });

      // Increment x-movement
      x += this.monthCellWidth + this.monthCellPadding;

      const monthTitle = createSVGElement({
        elementName: "g",
        id: "month-title",
        parentToAppend: monthContainer,
        content: this.getOutline(
          this.monthsNamesList[this.monthCounter],
          5,
          3.5,
          4
        ),
      });

      const yearTitle = createSVGElement({
        elementName: "g",
        id: "year-title",
        parentToAppend: monthContainer,
        content: this.getOutline(`${this.year}`, 30, 3.5, 4),
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
          this.dayCellWidth / 2,
          descenderException ? 6.5 : 7,
          this.lang === "ru" ? 2.9 : 2.6
        );

        const weekDayCell = createSVGElement({
          elementName: "g",
          parentToAppend: daysTitles,
          attributes: {
            transform: `translate(${Number(
              this.calendarGridX + this.dayCellWidth * i
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
        this.calendarGridX,
        this.calendarGridY,
        this.daysFontSize,
        "fill: none;stroke: none; stroke-width: 0; stroke-miterlimit: 0;"
      );

      // Append to main SVG
      mockup.appendChild(monthContainer);
    }
  }

  /**
   * @property {Fucntion} retrieveImages - load images from given array to DOM
   * @param {Array} imagesArr - Array of images to load
   */
  retrieveImages(imagesArr: ImageObject[]): void {
    if (imagesArr.length === 0) {
      return;
    }
    const imageFile = imagesArr[0].image;

    fetch(imageFile).then((res) => {
      this.imageElementGroup.innerHTML = "";

      const imgURL = res.url;

      const imageEl = createSVGElement({
        elementName: "image",
        parentToAppend: this.imageElementGroup,
        attributes: {
          height: this.imagePlaceholderHeight.toString(),
          width: this.imagePlaceholderWidth.toString(),
          x: this.imagePlaceholderX.toString(),
          y: this.imagePlaceholderY.toString(),
        },
        attributesNS: {
          href: imgURL,
        },
      });
    });
  }
}
