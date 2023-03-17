import Calendar from "./Calendar.js";
import { glyphsMP } from "./assets/Montserrat/MontserratGlyphs.js";

export default class MultiPageCalendar extends Calendar {
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
    this.dayCellHeight = 15;
    this.dayCellWidth = 25;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    this.reduceRate = 15;

    this.currentMonth = 0;

    this.createLoader();

    this.initDOMSVG();
    this.initBasicControls();
    this.initMultiPageControls();
    this.initBasicControlsEvents();
    this.initMultiPageControlsEvents();

    this.pagesArray = [...this.calendarInner.querySelectorAll("svg")];
  }

  initDOMSVG() {
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

          <g
            id="month-title-${i}"
            transform="translate(30 172.5) scale(0.5)">
          </g>

          <g
            id="year-title-${i}"
            transform="translate(150 174.4)">
          </g>

          <g id="days-titles-${i}">
          </g>

        </g>

        <g id="image-group">

        <rect id="image-placeholder-${i}"
          x="10.9"
          y="11.4"
          width="188.3"
          height="155"
          style="fill: #e8e8e8"/>
        </g>

      </svg>
      `;

      const daysTitles = monthContainer.querySelector(`#days-titles-${i}`);

      if (this.lang === "ru") {
        daysTitles.innerHTML = `
      <g
    transform= "translate(18.5 190) scale(0.45)">
      ${glyphsMP.weekDaysRu.monday}
            </g >

            <g
              transform="translate(48 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.tuesday}
            </g>

            <g
              transform="translate(74 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.wednesday}
            </g>

            <g
              transform="translate(97.2 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.thursday}
            </g>

            <g
              transform="translate(122 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.friday}
            </g>

            <g
              transform="translate(148 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.saturday}
            </g>

            <g
              transform="translate(169 190) scale(0.45)">
              ${glyphsMP.weekDaysRu.sunday}
            </g>
    `;
      } else if (this.lang === "en") {
        daysTitles.innerHTML = `
      <g
    transform="translate(22.72 190) scale(0.5)" >
      ${glyphsMP.weekDaysEn.monday}
            </g >

            <g
              transform="translate(47.72 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.tuesday}
            </g>

            <g
              transform="translate(69 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.wednesday}
            </g>

            <g
              transform="translate(96.72 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.thursday}
            </g>

            <g
              transform="translate(124.72 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.friday}
            </g>

            <g
              transform="translate(147 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.saturday}
            </g>

            <g
              transform="translate(173 190) scale(0.5)">
              ${glyphsMP.weekDaysEn.sunday}
            </g>
    `;
      }

      const monthEl = monthContainer.querySelector(`#month-title-${i}`);
      const yearEl = monthContainer.querySelector(`#year-title-${i}`);

      if (this.lang === 'ru') {
        monthEl.innerHTML = glyphsMP.monthsRu[this.monthCounter];
      } else if (this.lang === 'en') {
        monthEl.innerHTML = glyphsMP.monthsEn[this.monthCounter];
      }

      yearEl.innerHTML = glyphsMP.years[this.year];

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
        17,
        195.8,
        glyphsMP,
        'fill: none; stroke:#999999; stroke-miterlimit: 10; stroke-width: .5px;'
      );


    }

    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }

  initMultiPageControls() {
    this.prevBtn = document.createElement('button');
    this.prevBtn.id = 'prev-month';
    this.prevBtn.innerHTML = `<img src='./photo_calendar_maker/assets/icons/prev.svg'/>`;

    this.nextBtn = document.createElement('button');
    this.nextBtn.id = 'next-month';
    this.nextBtn.innerHTML = `<img src='./photo_calendar_maker/assets/icons/next.svg'/>`;

    this.allPDFDownloadBtn = document.createElement('button');
    this.allPDFDownloadBtn.id = 'pdf-download-all';
    this.allPDFDownloadBtn.innerHTML = `<img src='./photo_calendar_maker/assets/icons/pdf-multi.svg'/>`;


    this.multipleImagesInput = document.createElement('input');
    this.multipleImagesInput.setAttribute('type', 'file');
    this.multipleImagesInput.setAttribute('multiple', 'multiple');
    this.multipleImagesInput.setAttribute('accept', 'image/jpeg, image/png, image/jpg');
    this.multipleImagesInput.id = 'upload-multiple-input';
    this.multipleImagesInput.hidden = true;
    // this.multipleImagesInput.onclick = function(){
    //  this.value = null;
    // }


    this.uploadMultipleImgsBtn = document.createElement('label');
    this.uploadMultipleImgsBtn.setAttribute('for', 'upload-multiple-input')
    this.uploadMultipleImgsBtn.id = 'upload-multiple';
    this.uploadMultipleImgsBtn.innerHTML = `<img src='./photo_calendar_maker/assets/icons/upload-multi.svg'/>`;

    `    <input
      type="file"
      id="upload-input"
      accept="image/jpeg, image/png, image/jpg"
      hidden
      onclick="this.value=null;"/>
          
      <label for="upload-input" id="upload-btn" class="upload-btn">
        <img src='./photo_calendar_maker/assets/icons/upload.svg'/>
      </label>`


    this.controlsContainer.insertAdjacentElement('afterbegin', this.allPDFDownloadBtn);
    this.controlsContainer.insertAdjacentElement('afterbegin', this.prevBtn);

    this.controlsContainer.insertAdjacentElement('beforeend', this.multipleImagesInput);
    this.controlsContainer.insertAdjacentElement('beforeend', this.uploadMultipleImgsBtn);
    this.controlsContainer.insertAdjacentElement('beforeend', this.nextBtn);
  }

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

    this.multipleImagesInput.addEventListener('change', (e) => {
      if (this.cropper) {
        this.removeCropper();
      }
      this.uploadMultipleImages(e);
    })
    this.allPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF("all");
    });
  }

  setVisibleMonth() {
    this.calendarInner.style.left = `-${this.currentMonth * 100}%`;
  }

  uploadMultipleImages(e) {
    if (!e.target.files[0]) return;

    let files = [...e.target.files];

    let loadedFilesCounter = 0;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();

      reader.onload = (e) => {

        const imageGroup = this.calendarInner.querySelector(`#month-${i}-container #image-group`);
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


        reduced.then(reducedImage => {
          const resultImage = reducedImage ? reducedImage : e.target.result;
          imageEl.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            resultImage
          );
          imageGroup.innerHTML = "";
          imageGroup.appendChild(imageEl);
          loadedFilesCounter++;
        }).then(() => {
          if (loadedFilesCounter === files.length ||
            loadedFilesCounter === 11) {
            this.loading('hide');
          }
        })
      };

      reader.readAsDataURL(files[i]);
      this.loading('show');

      if (i === 11) {
        break;
      }
    }
  }
}