import { Calendar } from "./Calendar";
/**
 * Object with SVG icons
 */
import { icons } from "../assets/icons";

import { LoadingState } from "../../types.d";

/**
 * Class that generates Multi Page Calendar (each month on separate SVG)
 */
export class MultiPageCalendar extends Calendar {
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
   */
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang,
    type,
    fontsArray
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

    this.weekDaysNamesList = this.getWeekDays("long");

    // Mockup pre-defined dimensions
    this.dayCellHeight = 15;
    this.dayCellWidth = 25;

    this.calendarGridX = 17;
    this.calendarGridY = 195.8;
    this.daysFontSize = 7.5;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    this.createSVGMockup();

    if (Calendar.isNewType) {
      this.initMultiPageControls();
      this.initMultiPageControlsEvents();
    }

    this.pagesArray = [...this.calendarInner.querySelectorAll("svg")];
  }

  /**
   * @property {Function} createSVGMockup - creates SVG mockup in DOM
   * @returns {void}
   */
  createSVGMockup() {
    this.calendarWrapper = document.createElement("div");
    this.calendarWrapper.classList.add("calendar-wrapper");

    this.calendarInner = document.createElement("div");
    this.calendarInner.classList.add("calendar-inner");

    this.setVisibleMonth();

    // Create months templates
    for (let i = 0; i < 12; i++) {
      const monthContainer = document.createElement("div");

      monthContainer.classList.add("month-container");
      monthContainer.id = `month-${i}-container`;

      // Basic month mockup
      monthContainer.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 210 297" id="mockup-${i}">

        <rect
          id="background-rect-${i}"
          width="210"
          height="297"
          style="fill: #fff"/>
   
        <g id="days-grid-${i}"></g>
        
        <g id="text-group-${i}">

          <g id="month-title-${i}"></g>

          <g id="year-title-${i}"></g>

          <g id="days-titles-${i}">
          </g>

        </g>

        <g id="image-group">

        <rect id="image-placeholder-${i}"
          x=${this.imagePlaceholderX}
          y=${this.imagePlaceholderY}
          width=${this.imagePlaceholderWidth}
          height=${this.imagePlaceholderHeight}
          style="fill: #e8e8e8"/>
        </g>

      </svg>
      `;

      const daysTitles = monthContainer.querySelector(`#days-titles-${i}`);

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        const weekDayCell = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        weekDayCell.setAttribute(
          "transform",
          `translate(${this.calendarGridX + this.dayCellWidth * i} 192)`
        );

        const weekDayPath = this.getAndPlaceOutline(
          weekDayName,
          this.dayCellWidth / 2,
          -1,
          3.3
        );

        weekDayCell.appendChild(weekDayPath);
        daysTitles.appendChild(weekDayCell);
      });

      const monthEl = monthContainer.querySelector(`#month-title-${i}`);
      const yearEl = monthContainer.querySelector(`#year-title-${i}`);

      monthEl.innerHTML = this.getOutline(
        this.monthsNamesList[this.monthCounter],
        30,
        182.5,
        14
      );

      yearEl.innerHTML = this.getOutline(`${this.year}`, 140, 182.5, 14);

      // Insert year & month data on container
      monthContainer.dataset.year = this.year;
      monthContainer.dataset.month = this.monthCounter;

      if (i === 11) {
        this.lastMonth = this.monthCounter;
        this.endYear = this.year;
      }

      this.monthCounter++;

      if (this.monthCounter > 11) {
        this.monthCounter = 0;
        this.year++;
      }

      this.calendarInner.append(monthContainer);

      const currentMonthGrid = monthContainer.querySelector(`#days-grid-${i}`);

      this.createMonthGrid(
        currentMonthGrid,
        this.getFirstDay(this.monthCounter - 1, this.year) - 1,
        this.daysInMonth(this.monthCounter, this.year),
        this.daysInMonth(this.monthCounter - 1, this.year),
        this.calendarGridX,
        this.calendarGridY,
        this.daysFontSize,
        "fill: none; stroke:#999999; stroke-miterlimit: 10; stroke-width: .5px;"
      );
    }

    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }

  /**
   * @property {Function} initMultiPageControls - Creates controls of multi page calendar in DOM
   * @returns {void}
   */
  initMultiPageControls() {
    this.prevBtn = document.createElement("button");
    this.prevBtn.id = "prev-month";
    this.prevBtn.innerHTML = icons.prev;

    this.nextBtn = document.createElement("button");
    this.nextBtn.id = "next-month";
    this.nextBtn.innerHTML = icons.next;

    this.allPDFDownloadBtn = document.createElement("button");
    this.allPDFDownloadBtn.id = "pdf-download-all";
    this.allPDFDownloadBtn.innerHTML = icons.pdfMulti;

    this.multipleImagesInput = document.createElement("input");
    this.multipleImagesInput.setAttribute("type", "file");
    this.multipleImagesInput.setAttribute("multiple", "multiple");
    this.multipleImagesInput.setAttribute(
      "accept",
      "image/jpeg, image/png, image/jpg"
    );
    this.multipleImagesInput.id = "upload-multiple-input";
    this.multipleImagesInput.hidden = true;
    // this.multipleImagesInput.onclick = function(){
    //  this.value = null;
    // }

    this.uploadMultipleImgsBtn = document.createElement("label");
    this.uploadMultipleImgsBtn.setAttribute("for", "upload-multiple-input");
    this.uploadMultipleImgsBtn.id = "upload-multiple";
    this.uploadMultipleImgsBtn.innerHTML = icons.uploadMulti;

    `    <input
      type="file"
      id="upload-input"
      accept="image/jpeg, image/png, image/jpg"
      hidden
      onclick="this.value=null;"/>
          
      <label for="upload-input" id="upload-btn" class="upload-btn">
        <img src='./assets/icons/upload.svg'/>
      </label>`;

    this.controlsContainer.insertAdjacentElement(
      "afterbegin",
      this.allPDFDownloadBtn
    );
    this.controlsContainer.insertAdjacentElement("afterbegin", this.prevBtn);

    this.controlsContainer.insertAdjacentElement(
      "beforeend",
      this.multipleImagesInput
    );
    this.controlsContainer.insertAdjacentElement(
      "beforeend",
      this.uploadMultipleImgsBtn
    );
    this.controlsContainer.insertAdjacentElement("beforeend", this.nextBtn);
  }

  /**
   * @property {Function} initMultiPageControlsEvents - Adds events listener to controls buttons
   * @returns {void}
   */
  initMultiPageControlsEvents() {
    this.nextBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.currentMonth++;

      if (this.currentMonth > 11) {
        this.currentMonth = 0;
      }

      this.setVisibleMonth();
    });

    this.prevBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
      }

      this.setVisibleMonth();
    });

    this.multipleImagesInput.addEventListener("change", (e) => {
      if (this.cropper) {
        this.removeCropper();
      }
      this.uploadMultipleImages(e);
    });
    this.allPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF("all");
    });
  }

  /**
   * @property {Function} setVisibleMonth - show current month mockup in DOM by translate calendarInner container by X axis
   * @returns {void}
   */
  setVisibleMonth() {
    Calendar.current.calendarInner.style.left = `-${this.currentMonth * 100}%`;
  }

  /**
   * @property {Function} uploadMultipleImages - upload multiple images in calendar
   * @param {Event Object} e - object with files
   * @returns {void}
   */
  uploadMultipleImages(e) {
    if (!e.target.files[0]) return;

    let files = [...e.target.files];

    let loadedFilesCounter = 0;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageGroup = this.calendarInner.querySelector(
          `#month-${i}-container #image-group`
        );
        const imageEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "image"
        );

        imageEl.setAttribute("height", this.imagePlaceholderHeight);
        imageEl.setAttribute("width", this.imagePlaceholderWidth);
        imageEl.setAttribute("x", this.imagePlaceholderX);
        imageEl.setAttribute("y", this.imagePlaceholderY);

        // Image optimization
        const reduced = this.reduceImageSize(
          e.target.result,
          this.imagePlaceholderWidth * this.reduceRate,
          this.imagePlaceholderHeight * this.reduceRate
        );

        reduced
          .then((reducedImage) => {
            const resultImage = reducedImage ? reducedImage : e.target.result;

            this.saveToIDB(resultImage, i);

            imageEl.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "href",
              resultImage
            );
            imageGroup.innerHTML = "";
            imageGroup.appendChild(imageEl);
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

  /**
   * @property {Fucntion} retrieveImages - load images from given array to DOM
   * @param {Array} imagesArr - Array of images to load
   * @returns {void}
   */
  async retrieveImages(imagesArr) {
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
        );

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
        loadingCounter++;

        if (loadingCounter === imagesArr.length) {
          Calendar.loading(LoadingState.Hide);
        }
      });
    });
  }
}
