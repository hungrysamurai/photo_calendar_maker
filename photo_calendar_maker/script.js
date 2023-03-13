import { glyphsMP, glyphsSP } from "./assets/Montserrat/MontserratGlyphs.js";
import Cropper from "./assets/cropperjs/cropper.esm.js";

PDFDocument.prototype.addSVG = function (svg, x, y, options, lang) {
  return SVGtoPDF(this, svg, x, y, options), this;
};

class SinglePageCalendar {
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang
  ) {
    this.firstMonthIndex = firstMonthIndex;
    this.year = year;
    this.parentContainer = parentContainer;
    this.controlsContainer = controlsContainer;
    this.cropControlsContainer = cropControlsContainer;
    this.lang = lang;

    // Dimensions of document (px)
    this.outputDimensions = {
      A5: { width: 1748, height: 2480 },
      A4: { width: 2480, height: 3508 },
      A3: { width: 3508, height: 4961 },
    };
    this.currentSize = "A4";

    // Mockup pre-defined dimensions
    this.dayCellHeight = 44.35;
    this.dayCellWidth = 65.49;

    this.monthCellHeight = 375;
    this.monthCellWidth = 457.22;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    this.monthsList = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    // Month counters
    this.monthCounter = this.firstMonthIndex;

    this.initDOMSVG();
  }

  initDOMSVG() {
    this.calendarWrapper = document.createElement("div");
    this.calendarWrapper.classList.add("calendar-wrapper");

    this.calendarInner = document.createElement("div");
    this.calendarInner.classList.add("calendar-inner");

    const mockupContainer = document.createElement("div");

    mockupContainer.classList.add("mockup-container");

    mockupContainer.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2100 2970">
  
  <rect id="background-rect" width="2100" height="2970" style="fill: #fff"/>

  <g id="image-group">

    <rect id="image-placeholder" x="109" y="114" width="1883" height="1550" style="fill: #e8e8e8"/>

  </g>

</svg>
    `;

    let x = 80;
    let y = 1748.63;

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
        y += this.monthCellHeight;
        x = 80;
      }

      monthContainer.setAttribute("x", x);
      monthContainer.setAttribute("y", y);

      monthContainer.setAttribute("width", this.monthCellWidth);
      monthContainer.setAttribute("height", this.monthCellHeight);

      // Increment x-movement
      x += this.monthCellWidth + 23;

      // Populate current month
      monthContainer.innerHTML = `
      <g id="month-title">
          <g transform="translate(24 12)">
          ${glyphsSP.months[this.monthCounter]}
          </g>
        </g>

        <g id="year-title">
          <g transform="translate(360 18)">
          ${glyphsSP.years[this.year]}
          </g>
        </g>

        <g id="week-days-titles">
          <g transform="translate(18 67.5)">
          ${glyphsSP.weekDays.monday}
          </g>
          <g transform="translate(85.5 67.5)">
          ${glyphsSP.weekDays.tuesday}
          </g>
          <g transform="translate(146.13 67.5)">
          ${glyphsSP.weekDays.wednesday}
          </g>
          <g transform="translate(214.95 67.5)">
          ${glyphsSP.weekDays.thursday}
          </g>
          <g transform="translate(284.96 67.5)">
          ${glyphsSP.weekDays.friday}
          </g>
          <g transform="translate(351.06 67.5)">
          ${glyphsSP.weekDays.saturday}
          </g>
          <g transform="translate(414 67.5)">
           ${glyphsSP.weekDays.sunday}
          </g>
        </g>

          <g id="days-grid"></g>
        `;

      this.monthCounter++;

      if (this.monthCounter > 11) {
        this.monthCounter = 0;
        this.year++;
      }

      const currentMonthGrid = monthContainer.querySelector("#days-grid");
      console.log(this.daysInMonth(this.monthCounter, this.year), this.year);

      this.createMonthGrid(
        currentMonthGrid,
        this.getFirstDay(this.monthCounter - 1, this.year) - 1,
        this.daysInMonth(this.monthCounter, this.year),
        this.daysInMonth(this.monthCounter - 1, this.year) - 1
      );

      // Append to main SVG
      mockupContainer.querySelector("svg").appendChild(monthContainer);
    }

    // Insert to DOM
    this.calendarInner.append(mockupContainer);

    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }

  createMonthGrid(monthGrid, startIndex, totalDays, prevMonthDaysNumber) {
    let x = 0;
    let y = 86.42;

    let currentDayIndex = startIndex;
    let prevMonthDaysCount = prevMonthDaysNumber;

    // Set empty grid
    for (let i = 1; i < 43; i++) {
      if (i % 7 !== 0) {
        monthGrid.appendChild(this.createDayCell(x, y, i));
        x += this.dayCellWidth;
      } else {
        monthGrid.appendChild(this.createDayCell(x, y, i));
        x = 0;
        y += this.dayCellHeight;
      }
    }

    // All text elements in generated cells
    const cellsTextFields = monthGrid.querySelectorAll("g .cell-digit");

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      cellsTextFields[currentDayIndex].innerHTML = glyphsSP.digits[i - 1];
      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].innerHTML =
          glyphsSP.secondaryDigits[prevMonthDaysCount - 1];
        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].innerHTML =
          glyphsSP.secondaryDigits[i - 1];
        i++;
      }
    }
  }

  createDayCell(x, y, cellNumber) {
    let dayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    dayGroup.setAttribute("width", this.dayCellWidth);
    dayGroup.setAttribute("height", this.dayCellHeight);
    dayGroup.setAttribute("id", `day-${cellNumber}-cell`);

    dayGroup.innerHTML = `
      <rect y="${y}" x="${x}" width="65.49" height="44.35" style="fill: none"/>
              
        <g class="cell-digit"
        transform="translate(${x} ${y})">
      </g>;
    `;
    return dayGroup;
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  getFirstDay(month, year) {
    let index = new Date(year, month, 1);
    if (index.getDay() === 0) {
      return 7;
    }
    return index.getDay();
  }
}

class MultiPageCalendar {
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang
  ) {
    this.firstMonthIndex = firstMonthIndex;
    this.year = year;
    this.parentContainer = parentContainer;
    this.controlsContainer = controlsContainer;
    this.cropControlsContainer = cropControlsContainer;
    this.lang = lang;

    // Dimensions of document (px)
    this.outputDimensions = {
      A5: { width: 1748, height: 2480 },
      A4: { width: 2480, height: 3508 },
      A3: { width: 3508, height: 4961 },
    };
    this.currentSize = "A4";

    // Mockup pre-defined dimensions
    this.dayCellHeight = 15;
    this.dayCellWidth = 25;

    this.imagePlaceholderWidth = 188.3;
    this.imagePlaceholderHeight = 155;
    this.imagePlaceholderX = 10.9;
    this.imagePlaceholderY = 11.4;

    // Month counters
    this.monthCounter = this.firstMonthIndex;
    this.currentMonth = 0;

    this.initDOMSVG();
    this.initControls();
    this.initControlsEvents();
    // this.initCropperControls();

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

        <g id="image-group-${i}">

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
      ${glyphsMP.weekDays.monday}
            </g >

            <g
              transform="translate(48 190) scale(0.45)">
              ${glyphsMP.weekDays.tuesday}
            </g>

            <g
              transform="translate(74 190) scale(0.45)">
              ${glyphsMP.weekDays.wednesday}
            </g>

            <g
              transform="translate(97.2 190) scale(0.45)">
              ${glyphsMP.weekDays.thursday}
            </g>

            <g
              transform="translate(122 190) scale(0.45)">
              ${glyphsMP.weekDays.friday}
            </g>

            <g
              transform="translate(148 190) scale(0.45)">
              ${glyphsMP.weekDays.saturday}
            </g>

            <g
              transform="translate(169 190) scale(0.45)">
              ${glyphsMP.weekDays.sunday}
            </g>
    `;
      } else if (this.lang === "en") {
        daysTitles.innerHTML = `
      <g
    transform="translate(22.72 190) scale(0.5)" >
      ${glyphsMP.weekDays.monday}
            </g >

            <g
              transform="translate(47.72 190) scale(0.5)">
              ${glyphsMP.weekDays.tuesday}
            </g>

            <g
              transform="translate(69.72 190) scale(0.5)">
              ${glyphsMP.weekDays.wednesday}
            </g>

            <g
              transform="translate(96.72 190) scale(0.5)">
              ${glyphsMP.weekDays.thursday}
            </g>

            <g
              transform="translate(124.72 190) scale(0.5)">
              ${glyphsMP.weekDays.friday}
            </g>

            <g
              transform="translate(147 190) scale(0.5)">
              ${glyphsMP.weekDays.saturday}
            </g>

            <g
              transform="translate(173 190) scale(0.5)">
              ${glyphsMP.weekDays.sunday}
            </g>
    `;
      }

      const monthEl = monthContainer.querySelector(`#month-title-${i}`);
      const yearEl = monthContainer.querySelector(`#year-title-${i}`);

      monthEl.innerHTML = glyphsMP.months[this.monthCounter];
      yearEl.innerHTML = glyphsMP.years[this.year];

      // Insert year & month data on container
      monthContainer.dataset.year = this.year;
      monthContainer.dataset.month = this.monthCounter;

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
        this.daysInMonth(this.monthCounter - 1, this.year)
      );
    }

    this.calendarWrapper.append(this.calendarInner);
    this.parentContainer.append(this.calendarWrapper);
  }

  initControls() {
    this.controlsContainer.innerHTML = `
      <button id ="prev-month">
        <img src='./photo_calendar_maker/assets/icons/prev.svg' />
      </button>


      <button id="pdf-download-current">
      <img src='./photo_calendar_maker/assets/icons/pdf-single.svg'/>
      </button>
      <button id="pdf-download-all">
      <img src='./photo_calendar_maker/assets/icons/pdf-multi.svg'/>
      </button>

      <button id="png-download">
      <img src='./photo_calendar_maker/assets/icons/png.svg'/>
      </button>
  
        <select id="format-select">
          <option value="A5">A5</option>
          <option value="A4" selected>A4</option>
          <option value="A3">A3</option>
       </select>

    <button id="crop-btn">
          <img src='./photo_calendar_maker/assets/icons/crop.svg'/>
    </button>

    <input
      type="file"
      id="upload-input"
      accept="image/jpeg, image/png, image/jpg"
      hidden
      onclick="this.value=null;"/>
          <label for="upload-input" id="upload-btn" class="upload-btn">
          <img src='./photo_calendar_maker/assets/icons/upload.svg'/>
          </label>

          <button id="next-month">
      <img src='./photo_calendar_maker/assets/icons/next.svg'/>
      </button>
    `;

    this.nextBtn = this.controlsContainer.querySelector("#next-month");
    this.prevBtn = this.controlsContainer.querySelector("#prev-month");
    this.currentPDFDownloadBtn = this.controlsContainer.querySelector(
      "#pdf-download-current"
    );
    this.allPDFDownloadBtn =
      this.controlsContainer.querySelector("#pdf-download-all");
    this.pngDownloadBtn = this.controlsContainer.querySelector("#png-download");
    this.uploadImgBtn = this.controlsContainer.querySelector("#upload-btn");
    this.formatSelectBtn =
      this.controlsContainer.querySelector("#format-select");

    this.cropBtn = this.controlsContainer.querySelector("#crop-btn");
    this.uploadImgInput = this.controlsContainer.querySelector("#upload-input");
  }

  initControlsEvents() {
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

    this.currentPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF("current");
    });

    this.allPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF("all");
    });

    this.pngDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadCurrentMonthPNG();
    });

    this.cropBtn.addEventListener("click", () => {
      if (this.cropper) return;

      const currentImageElement = this.calendarInner.querySelector(
        `#month-${this.currentMonth}-container image`
      );

      if (currentImageElement) {
        // this.initCropperControls();
        this.initCropper(currentImageElement);
        this.cropControlsContainer.classList.remove("hide");
      }
    });

    this.uploadImgInput.addEventListener("input", (e) => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.uploadImgCurrentMonth(e);
    });

    this.formatSelectBtn.addEventListener("input", (e) => {
      this.currentSize = e.target.value;
    });
  }

  setVisibleMonth() {
    this.calendarInner.style.left = `-${this.currentMonth * 100}%`;
  }

  downloadPDF(amount) {
    let pagesArray = [];

    const doc = new PDFDocument({ size: this.currentSize });
    const stream = doc.pipe(blobStream());

    if (amount === "current") {
      const currentMonthContainer = this.calendarInner.querySelector(
        `#month-${this.currentMonth}-container`
      );
      pagesArray.push(currentMonthContainer.querySelector("svg"));

      doc.info["Title"] = this.getFileName();
    }

    if (amount === "all") {
      pagesArray = this.pagesArray;
      doc.info["Title"] = this.getFileName(true);
    }

    pagesArray.forEach((page, i) => {
      doc.addSVG(page, 0, 0);

      if (i !== pagesArray.length - 1) doc.addPage();
    });

    doc.end();

    stream.on("finish", function () {
      const url = stream.toBlobURL("application/pdf");

      const a = document.createElement("a");
      const my_evt = new MouseEvent("click");
      a.download = doc.info["Title"];
      a.href = url;
      a.dispatchEvent(my_evt);
    });
  }

  downloadCurrentMonthPNG(e) {
    const svg = this.calendarInner.querySelector(
      `#month-${this.currentMonth}-container svg`
    );

    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    canvas.width = this.outputDimensions[this.currentSize].width;
    canvas.height = this.outputDimensions[this.currentSize].height;

    const ctx = canvas.getContext("2d");

    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      const fileName = this.getFileName();

      if (window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(canvas.msToBlob(), fileName);
        e.preventDefault();
      } else {
        const a = document.createElement("a");
        const my_evt = new MouseEvent("click");
        a.download = fileName;
        a.href = dataURL;
        a.dispatchEvent(my_evt);
      }
    };
  }

  getFileName(span) {
    if (span) {
      const firstMonth = this.pagesArray[0].parentElement.dataset.month;
      const firstMonthYear = this.pagesArray[0].parentElement.dataset.year;
      const date1 = new Date(+firstMonthYear, +firstMonth);
      const firstMonthName = date1.toLocaleString("default", { month: "long" });

      const lastMonth =
        this.pagesArray[this.pagesArray.length - 1].parentElement.dataset.month;
      const lastMonthYear =
        this.pagesArray[this.pagesArray.length - 1].parentElement.dataset.year;
      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString("default", {
        month: "long",
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear} `;
    }

    const currentMonthContainer = this.calendarInner.querySelector(
      `#month-${this.currentMonth}-container`
    );

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;
    const date = new Date(+year, +month);
    const monthName = date.toLocaleString("default", { month: "long" });

    return `${monthName}_${year}`;
  }

  uploadImgCurrentMonth(e) {
    if (!e.target.files[0]) return;

    const imageFile = e.target.files[0];

    const reader = new FileReader();

    reader.onload = (e) => {
      const imageGroup = this.calendarInner.querySelector(
        `#image-group-${this.currentMonth}`
      );

      imageGroup.innerHTML = "";

      const imageEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );

      imageEl.setAttribute("height", this.imagePlaceholderHeight);
      imageEl.setAttribute("width", this.imagePlaceholderWidth);
      imageEl.setAttribute("x", this.imagePlaceholderX);
      imageEl.setAttribute("y", this.imagePlaceholderY);

      imageEl.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        e.target.result
      );

      imageGroup.appendChild(imageEl);
      console.log("...image uploaded!");

      // this.initCropper(imageEl);
    };

    reader.readAsDataURL(imageFile);
    console.log("start upload image...");
  }

  initCropper(currentImageElement) {
    const imageFile = currentImageElement.getAttribute("href");

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        this.cropperOuter = document.createElement("div");
        this.cropperOuter.classList.add("cropper-outer-container");

        this.cropperOuter.style.position = "absolute";
        this.cropperOuter.style.left = `${
          currentImageElement.getBoundingClientRect().left
        }px`;
        this.cropperOuter.style.top = `${
          currentImageElement.getBoundingClientRect().top
        }px`;
        this.cropperOuter.style.width = `${
          currentImageElement.getBoundingClientRect().width
        }px`;
        this.cropperOuter.style.height = `${
          currentImageElement.getBoundingClientRect().height
        }px`;

        const imageElement = document.createElement("img");
        imageElement.classList.add("image-element");
        imageElement.src = URL.createObjectURL(imageFile);

        this.cropperOuter.appendChild(imageElement);

        document.body.append(this.cropperOuter);
        currentImageElement.style.display = "none";

        this.cropper = new Cropper(imageElement, {
          viewMode: 2,
          dragMode: "move",
          modal: false,
          background: false,
          autoCropArea: 1,

          ready: () => {
            // const bindedApply = this.applyCrop.bind(this);
            // this.bindedApplyCropFunction = bindedApply;

            this.initCropperControls();

            this.applyCropBtn.addEventListener("click", () => {
              this.applyCrop(currentImageElement);
            });
          },

          zoom: (e) => {
            if (e.detail.ratio < e.detail.oldRatio) {
              if (
                this.cropper.canvasData.width - 100 <
                this.cropper.initialCanvasData.width
              ) {
                this.cropper.reset();
              }
            }
          },
        });
      });
  }

  applyCrop(currentImageElement) {
    // const currentImageElement = this.calendarInner.querySelector(
    //   `#month - ${ this.currentMonth } -container image`
    // );
    // console.log(this.cropper);
    const canvas = this.cropper.getCroppedCanvas();

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    ctx.drawImage(canvas, 0, 0);
    const resultURL = canvas.toDataURL("image/png");

    currentImageElement.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
      resultURL
    );

    currentImageElement.style.display = "block";
    this.removeCropper();
  }

  removeCropper() {
    const currentImageElement = this.calendarInner.querySelector(
      `#month-${this.currentMonth}-container image`
    );

    currentImageElement.style.display = "block";
    this.cropper.destroy();
    this.cropper = undefined;
    this.cropperOuter.remove();
    this.cropperOuter = undefined;

    this.cropControlsContainer.innerHTML = "";
  }

  initCropperControls() {
    this.cropControlsContainer.innerHTML = `
      <button id="apply-crop">
        <img src='./photo_calendar_maker/assets/icons/done.svg'/>
    </button>
      <button id="cancel-crop">
        <img src='./photo_calendar_maker/assets/icons/cancel.svg'/>
      </button>
    `;

    this.applyCropBtn = this.cropControlsContainer.querySelector("#apply-crop");
    this.cancelCropBtn =
      this.cropControlsContainer.querySelector("#cancel-crop");

    this.cancelCropBtn.addEventListener("click", () => {
      this.removeCropper();
    });
  }

  createMonthGrid(monthGrid, startIndex, totalDays, prevMonthDaysNumber) {
    let x = 17;
    let y = 195.8;

    let currentDayIndex = startIndex;
    let prevMonthDaysCount = prevMonthDaysNumber;

    // Set empty grid
    for (let i = 1; i < 43; i++) {
      if (i % 7 !== 0) {
        monthGrid.appendChild(this.createDayCell(x, y, i));
        x += this.dayCellWidth;
      } else {
        monthGrid.appendChild(this.createDayCell(x, y, i));
        x = 17;
        y += this.dayCellHeight;
      }
    }

    // All text elements in generated cells
    const cellsTextFields = monthGrid.querySelectorAll("g .cell-digit");

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      // cellsTextFields[currentDayIndex].textContent = i;
      cellsTextFields[currentDayIndex].innerHTML = glyphsMP.digits[i - 1];
      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].innerHTML =
          glyphsMP.secondaryDigits[prevMonthDaysCount - 1];
        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].innerHTML =
          glyphsMP.secondaryDigits[i - 1];
        i++;
      }
    }
  }

  createDayCell(x, y, cellNumber) {
    let dayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    dayGroup.setAttribute("width", this.dayCellWidth);
    dayGroup.setAttribute("height", this.dayCellHeight);
    dayGroup.setAttribute("id", `day-${cellNumber}-cell`);

    dayGroup.innerHTML = `
      <rect x = "${x}" y = "${y}" width="${this.dayCellWidth}" height="${this.dayCellHeight}"
    style = "fill: none; stroke: #999999; stroke-miterlimit: 10; stroke-width: .5px;" ></rect >

      <g class="cell-digit"
        transform="translate(${x} ${y})">
      </g>;
    `;
    return dayGroup;
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  getFirstDay(month, year) {
    let index = new Date(year, month, 1);
    if (index.getDay() === 0) {
      return 7;
    }
    return index.getDay();
  }
}

const getButton = document.querySelector("#get-button");
const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");

const calendarContainer = document.querySelector(".calendar-container");
const controlsContainer = document.querySelector(".controls-container");
const cropControlsContainer = document.querySelector(
  ".crop-controls-container"
);

let currentCalendar;
getButton.addEventListener("click", () => {
  const year = +yearInput.value;
  const month = +monthInput.value;

  calendarContainer.innerHTML = "";
  if (document.querySelector(".cropper-outer-container")) {
    document.querySelector(".cropper-outer-container").remove();
  }
  // currentCalendar = new MultiPageCalendar(
  //   month,
  //   year,
  //   calendarContainer,
  //   controlsContainer,
  //   cropControlsContainer,
  //   "ru"
  // );
  currentCalendar = new SinglePageCalendar(
    month,
    year,
    calendarContainer,
    controlsContainer,
    cropControlsContainer,
    "ru"
  );
});
