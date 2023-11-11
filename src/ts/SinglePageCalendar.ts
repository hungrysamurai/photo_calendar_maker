import { Calendar } from "./Calendar";

import { CalendarLanguage, CalendarType } from "../../types";
/**
 * Class that generates Single Page Calendar (all months on one page)
 */
export class SinglePageCalendar extends Calendar {
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
    console.log(Calendar.isNewType);
    this.weekDaysNamesList = this.getWeekDays("short");

    // Mockup pre-defined dimensions
    this.dayCellHeight = 4.435;
    this.dayCellWidth = 6.549;

    this.calendarGridX = 0;
    this.calendarGridY = 8.642;
    this.daysFontSize = 3.3;

    this.monthCellHeight = 37.5;
    this.monthCellWidth = 45.722;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    this.initDOMSVG();
  }

  /**
   * @property {Function} initDOMSVG - creates SVG mockup in DOM
   * @returns {void}
   */
  initDOMSVG() {
    this.calendarWrapper = document.createElement("div");
    this.calendarWrapper.classList.add("calendar-wrapper");

    this.calendarInner = document.createElement("div");
    this.calendarInner.classList.add("calendar-inner");

    const mockupContainer = document.createElement("div");
    mockupContainer.id = "mockup-container";

    mockupContainer.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297" id="mockup">
  
  <rect id="background-rect" width="210" height="297" style="fill: #fff"/>

  <g id="image-group">

    <rect id="image-placeholder" 
    x=${this.imagePlaceholderX} 
    y=${this.imagePlaceholderX} 
    width=${this.imagePlaceholderWidth} 
    height=${this.imagePlaceholderHeight}
    style="fill: #e8e8e8"/>

  </g>

</svg>
    `;

    let x = 10;
    let y = 170;

    // Global loop
    for (let i = 0; i < 12; i++) {
      // Create month container
      const monthContainer = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      monthContainer.id = `month-container-${i}`;

      // if new row...
      if (i === 4 || i === 8) {
        // Increment y-movement
        y += this.monthCellHeight + 2.3;
        x = 10;
      }

      monthContainer.setAttribute("x", x);
      monthContainer.setAttribute("y", y);

      monthContainer.setAttribute("width", this.monthCellWidth);
      monthContainer.setAttribute("height", this.monthCellHeight);

      monthContainer.dataset.month = this.monthCounter;
      monthContainer.dataset.year = this.year;

      // Increment x-movement
      x += this.monthCellWidth + 2.3;

      // Populate current month
      monthContainer.innerHTML = `
      <g id="month-title">
          <g>
          ${this.getOutline(this.monthsNamesList[this.monthCounter], 5, 3.5, 4)}
          </g>
        </g>

        <g id="year-title">
          <g>
          ${this.getOutline(`${this.year}`, 30, 3.5, 4)}
          </g>
        </g>

        <g id="week-days-titles">
          </g>
        </g>

          <g id="days-grid"></g>
        `;

      const daysTitles = monthContainer.querySelector("#week-days-titles");

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        const weekDayCell = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        weekDayCell.setAttribute(
          "transform",
          `translate(${Number(
            this.calendarGridX + this.dayCellWidth * i
          ).toFixed(2)} 0)`
        );

        // исключение для 'Cр'
        let descenderException = i === 2 && this.lang === "ru" ? true : false;

        const weekDayPath = this.getAndPlaceOutline(
          weekDayName,
          this.dayCellWidth / 2,
          descenderException ? 6.5 : 7,
          this.lang === "ru" ? 2.9 : 2.6
        );

        weekDayCell.appendChild(weekDayPath);
        daysTitles.appendChild(weekDayCell);
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

      const currentMonthGrid = monthContainer.querySelector("#days-grid");

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
      mockupContainer.querySelector("svg").appendChild(monthContainer);
    }

    // Insert to DOM
    this.calendarInner.append(mockupContainer);
    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }

  /**
   * @property {Fucntion} retrieveImages - load images from given array to DOM
   * @param {Array} imagesArr - Array of images to load
   * @returns {void}
   */
  retrieveImages(imagesArr) {
    if (imagesArr.length === 0) {
      return;
    }

    const imageFile = imagesArr[0].image;

    fetch(imageFile).then((res) => {
      const imgURL = res.url;
      const imageGroup = document.querySelector("#image-group");

      const imageEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );

      imageEl.setAttribute("height", this.imagePlaceholderHeight);
      imageEl.setAttribute("width", this.imagePlaceholderWidth);
      imageEl.setAttribute("x", this.imagePlaceholderX);
      imageEl.setAttribute("y", this.imagePlaceholderY);
      imageEl.setAttributeNS("http://www.w3.org/1999/xlink", "href", imgURL);

      imageGroup.innerHTML = "";
      imageGroup.appendChild(imageEl);
    });
  }
}
