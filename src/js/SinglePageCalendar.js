import { Calendar } from "./Calendar.js";

/**
 * Class that generates Single Page Calendar (all months on one page)
 */
export class SinglePageCalendar extends Calendar {

  /**
   * 
   * @param {number} firstMonthIndex 
   * @param {number} year 
   * @param {HTMLElement} parentContainer 
   * @param {HTMLElement} controlsContainer 
   * @param {HTMLElement} cropControlsContainer 
   * @param {string} lang 
   * @param {string} type 
   * @param {Array} fontsArray
   * @param {Object} manualXCoordsArray
   */
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang,
    type,
    fontsArray,
    manualXCoordsArray
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      fontsArray
    );

    console.log(manualXCoordsArray);
    this.weekDaysNamesList = this.getWeekDays('short');

    // Mockup pre-defined dimensions
    this.dayCellHeight = 4.435;
    this.dayCellWidth = 6.549;

    this.monthCellHeight = 37.5;
    this.monthCellWidth = 45.722;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    // Weekdays positions
    this.weekDayXCoords = manualXCoordsArray[this.lang]

    this.createLoader();
    this.initDOMSVG();
    this.initBasicControls();
    this.initBasicControlsEvents();
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

    <rect id="image-placeholder" x="10.9" y="11.4" width="188.3" height="155" style="fill: #e8e8e8"/>

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

      // Generate week days paths
      const weekDaysEls = this.weekDaysNamesList.map((weekDayName, i) => {
        return `
        <g>
        ${this.getOutline(
          weekDayName, this.weekDayXCoords[i],
          8,
          this.lang === 'ru' ? 2.9 : 2.6
        )}
        </g>
         `}).join('');


      monthContainer.innerHTML = `
      <g id="month-title">
          <g>
          ${this.getOutline(
        this.monthsNamesList[this.monthCounter],
        5, 3.5, 4
      )}
          </g>
        </g>

        <g id="year-title">
          <g>
          ${this.getOutline(`${this.year}`, 30, 3.5, 4)}
          </g>
        </g>

        <g id="week-days-titles">
        ${weekDaysEls}
          </g>
        </g>

          <g id="days-grid"></g>
        `;


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
        8.642,
        3.3,
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
