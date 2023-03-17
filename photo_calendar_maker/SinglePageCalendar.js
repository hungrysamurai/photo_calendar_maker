import Calendar from "./Calendar.js";
import { glyphsSP } from "./assets/Montserrat/MontserratGlyphs.js";

export default class SinglePageCalendar extends Calendar {
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang,
    type
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type
    );

    // Mockup pre-defined dimensions
    this.dayCellHeight = 44.35;
    this.dayCellWidth = 65.49;

    this.monthCellHeight = 375;
    this.monthCellWidth = 457.22;

    this.imagePlaceholderWidth = 1883;
    this.imagePlaceholderHeight = 1550;
    this.imagePlaceholderX = 109;
    this.imagePlaceholderY = 114;

    this.reduceRate = 1.5;

    this.createLoader();
    this.initDOMSVG();
    this.initBasicControls();
    this.initBasicControlsEvents();
  }

  initDOMSVG() {
    this.calendarWrapper = document.createElement("div");
    this.calendarWrapper.classList.add("calendar-wrapper");

    this.calendarInner = document.createElement("div");
    this.calendarInner.classList.add("calendar-inner");

    const mockupContainer = document.createElement("div");
    mockupContainer.id = "mockup-container";

    mockupContainer.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970" id="mockup">
  
  <rect id="background-rect" width="2100" height="2970" style="fill: #fff"/>

  <g id="image-group">

    <rect id="image-placeholder" x="109" y="114" width="1883" height="1550" style="fill: #e8e8e8"/>

  </g>

</svg>
    `;

    let x = 95;
    let y = 1700;

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
        y += this.monthCellHeight + 23;
        x = 100;
      }

      monthContainer.setAttribute("x", x);
      monthContainer.setAttribute("y", y);

      monthContainer.setAttribute("width", this.monthCellWidth);
      monthContainer.setAttribute("height", this.monthCellHeight);

      monthContainer.dataset.month = this.monthCounter;
      monthContainer.dataset.year = this.year;

      // Increment x-movement
      x += this.monthCellWidth + 23;

      // Populate current month

      if (this.lang === "ru") {
        monthContainer.innerHTML = `
      <g id="month-title">
          <g transform="translate(24 12)">
          ${glyphsSP.monthsRu[this.monthCounter]}
          </g>
        </g>

        <g id="year-title">
          <g transform="translate(360 18)">
          ${glyphsSP.years[this.year]}
          </g>
        </g>

        <g id="week-days-titles">
          <g transform="translate(21 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.monday}
          </g>
          <g transform="translate(87.8 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.tuesday}
          </g>
          <g transform="translate(149 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.wednesday}
          </g>
          <g transform="translate(217 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.thursday}
          </g>
          <g transform="translate(283 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.friday}
          </g>
          <g transform="translate(346 67.5) scale(1.5)">
          ${glyphsSP.weekDaysRu.saturday}
          </g>
          <g transform="translate(411 67.5) scale(1.5)">
           ${glyphsSP.weekDaysRu.sunday}
          </g>
        </g>

          <g id="days-grid"></g>
        `;
      } else if (this.lang === 'en') {
        monthContainer.innerHTML = `
      <g id="month-title">
          <g transform="translate(24 12)">
          ${glyphsSP.monthsEn[this.monthCounter]}
          </g>
        </g>

        <g id="year-title">
          <g transform="translate(360 18)">
          ${glyphsSP.years[this.year]}
          </g>
        </g>

        <g id="week-days-titles">
          <g transform="translate(18 67.5)">
          ${glyphsSP.weekDaysEn.monday}
          </g>
          <g transform="translate(85.5 67.5)">
          ${glyphsSP.weekDaysEn.tuesday}
          </g>
          <g transform="translate(146.13 67.5)">
          ${glyphsSP.weekDaysEn.wednesday}
          </g>
          <g transform="translate(214.95 67.5)">
          ${glyphsSP.weekDaysEn.thursday}
          </g>
          <g transform="translate(284.96 67.5)">
          ${glyphsSP.weekDaysEn.friday}
          </g>
          <g transform="translate(351.06 67.5)">
          ${glyphsSP.weekDaysEn.saturday}
          </g>
          <g transform="translate(414 67.5)">
           ${glyphsSP.weekDaysEn.sunday}
          </g>
        </g>

          <g id="days-grid"></g>
        `;
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

      const currentMonthGrid = monthContainer.querySelector("#days-grid");

      this.createMonthGrid(
        currentMonthGrid,
        this.getFirstDay(this.monthCounter - 1, this.year) - 1,
        this.daysInMonth(this.monthCounter, this.year),
        this.daysInMonth(this.monthCounter - 1, this.year) - 1,
        0,
        86.42,
        glyphsSP,
        'fill: none;stroke: none; stroke-width: 0; stroke-miterlimit: 0;'
      );

      // Append to main SVG
      mockupContainer.querySelector("svg").appendChild(monthContainer);
    }

    // Insert to DOM
    this.calendarInner.append(mockupContainer);
    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }
}