import { glyphsMP, glyphsSP } from "./assets/Montserrat/MontserratGlyphs.js";
import Cropper from "./assets/cropperjs/cropper.esm.js";

class Calendar {
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

    // Month counters
    this.monthCounter = this.firstMonthIndex;

    this.firstMonth = this.firstMonthIndex;
    this.startYear = this.year;
    this.lastMonth;
    this.endYear;
  }

  initBasicControls() {

    this.controlsContainer.innerHTML = `
      <button id="pdf-download-current">
        <img src='./photo_calendar_maker/assets/icons/pdf-single.svg'/>
      </button>
     
      <button id="jpg-download">
        <img src='./photo_calendar_maker/assets/icons/jpg.svg'/>
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
    `;

    this.currentPDFDownloadBtn = this.controlsContainer.querySelector(
      "#pdf-download-current"
    );
    this.jpgDownloadBtn = this.controlsContainer.querySelector("#jpg-download");
    this.uploadImgBtn = this.controlsContainer.querySelector("#upload-btn");
    this.formatSelectBtn =
      this.controlsContainer.querySelector("#format-select");
    this.cropBtn = this.controlsContainer.querySelector("#crop-btn");
    this.uploadImgInput = this.controlsContainer.querySelector("#upload-input");
  }

  initBasicControlsEvents() {

    this.currentPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF("current");
    });

    this.jpgDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadCurrentJPG();
    });

    this.cropBtn.addEventListener("click", () => {
      if (this.cropper) return;

      const currentImageElement = this.getCurrentMockup('image');

      if (currentImageElement) {
        this.initCropper(currentImageElement);
        this.cropControlsContainer.classList.remove("hide");
      }
    });

    this.uploadImgInput.addEventListener("input", (e) => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.uploadImg(e);
    });

    this.formatSelectBtn.addEventListener("input", (e) => {
      this.currentSize = e.target.value;
    });
  }

  uploadImg(e) {
    if (!e.target.files[0]) return;
    const imageFile = e.target.files[0];

    const reader = new FileReader();

    reader.onload = (e) => {
      const imageGroup = this.getCurrentMockup('#image-group');

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
        console.log(e.target.result);
        console.log(reducedImage);
        imageEl.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          resultImage
        );
        imageGroup.innerHTML = "";
        imageGroup.appendChild(imageEl);
      })

      console.log("...image uploaded!");
    };

    reader.readAsDataURL(imageFile);
    console.log("start upload image...");
  }

  // Reduce image file size & resolution
  async reduceImageSize(base64Str, maxWidth, maxHeight) {

    let resized_base64 = await new Promise((resolve) => {

      let img = new Image()
      img.src = base64Str
      img.onload = () => {
        let width = img.width
        let height = img.height
        // console.log(maxWidth, maxHeight, width, height);
        if (width <= maxWidth || height <= maxHeight) {
          // If resolution of image is less than actual placeholder size
          resolve();
        }

        let canvas = document.createElement('canvas')
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Return reduced image
        resolve(canvas.toDataURL("image/jpeg"))
      }
    });
    return resized_base64;
  }

  downloadCurrentJPG() {
    const svg = this.getCurrentMockup('svg');
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    canvas.width = this.outputDimensions[this.currentSize].width;
    canvas.height = this.outputDimensions[this.currentSize].height;
    const ctx = canvas.getContext("2d");

    // SVG attributes fix for proper rasterization
    let properAttributes;
    if (this instanceof MultiPageCalendar) {
      properAttributes =
        svgData.replace(`viewBox="0 0 210 297"`, `width="210" height="297" version="1.1"`);
    } else if (this instanceof SinglePageCalendar) {
      properAttributes =
        svgData.replace(`viewBox="0 0 2100 2970"`, `width="2100" height="2970" version="1.1"`);
    }

    const img = new Image();
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(properAttributes));

    img.onload = () => {

      // Draw svg-to-img on canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/jpeg");
      const fileName = this.getFileName();

      const a = document.createElement("a");
      a.download = fileName;
      a.href = dataURL;
      a.click();
      a.remove();

    };
  }

  downloadPDF(amount) {
    let pagesArray = [];

    const doc = new PDFDocument({ size: this.currentSize });
    const stream = doc.pipe(blobStream());

    if (amount === "current") {
      pagesArray.push(this.getCurrentMockup('svg'));
      doc.info["Title"] = this.getFileName();
    }

    if (amount === "all") {
      pagesArray = this.pagesArray;
      doc.info["Title"] = this.getFileName(true);
    }

    pagesArray.forEach((page, i) => {
      SVGtoPDF(doc, page, 0, 0);

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

  getFileName(span) {
    if (span || this instanceof SinglePageCalendar) {
      const firstMonth = this.firstMonth;
      const firstMonthYear = this.startYear;

      const date1 = new Date(+firstMonthYear, +firstMonth);
      const firstMonthName = date1.toLocaleString("default", { month: "long" });

      const lastMonth = this.lastMonth;
      const lastMonthYear = this.endYear;

      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString("default", {
        month: "long",
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear}`;
    }

    const currentMonthContainer = this.getCurrentMockup()

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(+year, +month);
    const monthName = date.toLocaleString("default", { month: "long" });

    return `${monthName}_${year}`;
  }

  initCropper(currentImageElement) {
    const imageFile = currentImageElement.getAttribute("href");

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        this.cropperOuter = document.createElement("div");
        this.cropperOuter.classList.add("cropper-outer-container");

        this.updateCropperPosition(currentImageElement);

        const imageElement = document.createElement("img");
        imageElement.classList.add("image-element");
        imageElement.src = URL.createObjectURL(imageFile);

        this.cropperOuter.appendChild(imageElement);

        document.body.append(this.cropperOuter);
        // currentImageElement.style.display = "none";

        this.cropper = new Cropper(imageElement, {
          viewMode: 0,
          dragMode: "none",
          modal: false,
          background: false,
          autoCropArea: 1,
          ready: () => {
            this.initCropperControls();

            this.applyCropBtn.addEventListener("click", () => {
              this.applyCrop(currentImageElement);
            });

            this.cropper.initialZoomRatio = this.cropper.getCanvasData().width / this.cropper.getCanvasData().naturalWidth;

            window.onresize = () => {
              this.updateCropperPosition(currentImageElement);
            }
          },

          zoom: (e) => {
            this.cropper.setAspectRatio(0);
            this.cropper.crop()

            // Reset cropbox if zoomed out
            if (e.detail.ratio < e.detail.oldRatio) {
              if (
                this.cropper.canvasData.width - 10 <
                this.cropper.initialCanvasData.width
              ) {
                this.cropper.reset();
              }
            }

            this.cropper.zoomRatio = this.cropper.getCanvasData().width / this.cropper.getCanvasData().naturalWidth;

            if ((this.cropper.zoomRatio.toFixed(5)) > (this.cropper.initialZoomRatio).toFixed(5)) {
              this.cropper.setDragMode("move");
              this.cropper.options.viewMode = 3;
              console.log('move');
            } else {
              this.cropper.setDragMode("none");
              this.cropper.options.viewMode = 0;
              console.log('none');
            }
          },
        });
      });
  }

  updateCropperPosition(currentImageElement) {
    console.log(currentImageElement);
    this.cropperOuter.style.position = "absolute";
    this.cropperOuter.style.left = `${currentImageElement.getBoundingClientRect().left
      }px`;
    this.cropperOuter.style.top = `${currentImageElement.getBoundingClientRect().top
      }px`;
    this.cropperOuter.style.width = `${currentImageElement.getBoundingClientRect().width
      }px`;
    this.cropperOuter.style.height = `${currentImageElement.getBoundingClientRect().height
      }px`;
  }

  applyCrop(currentImageElement) {
    const canvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
      fillColor: 'white'
    });

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    ctx.drawImage(canvas, 0, 0);

    const resultURL = canvas.toDataURL("image/jpeg");

    currentImageElement.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
      resultURL
    );

    // currentImageElement.style.display = "block";
    this.removeCropper();
  }

  removeCropper() {
    const currentImageElement = this.getCurrentMockup('image');

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

  getCurrentMockup(element = '') {
    if (this instanceof MultiPageCalendar) {
      return this.calendarInner.querySelector(
        `#month-${this.currentMonth}-container ${element}`
      );
    } else if (this instanceof SinglePageCalendar) {
      return this.calendarInner.querySelector(`#mockup-container ${element}`);
    }
  }

  createMonthGrid(monthGrid, startIndex, totalDays, prevMonthDaysNumber, initialX, initialY, glyphsSet, cellStyles) {
    let x = initialX;
    let y = initialY;

    let currentDayIndex = startIndex;
    let prevMonthDaysCount = prevMonthDaysNumber;

    // Set empty grid
    for (let i = 1; i < 43; i++) {
      if (i % 7 !== 0) {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x += this.dayCellWidth;
      } else {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x = initialX;
        y += this.dayCellHeight;
      }
    }

    // All text elements in generated cells
    const cellsTextFields = monthGrid.querySelectorAll("g .cell-digit");

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      cellsTextFields[currentDayIndex].innerHTML = glyphsSet.digits[i - 1];
      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].innerHTML =
          glyphsSet.secondaryDigits[prevMonthDaysCount - 1];
        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].innerHTML =
          glyphsSet.secondaryDigits[i - 1];
        i++;
      }
    }
  }

  createDayCell(x, y, cellNumber, cellStyles) {
    let dayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    dayGroup.setAttribute("width", this.dayCellWidth);
    dayGroup.setAttribute("height", this.dayCellHeight);
    dayGroup.setAttribute("id", `day-${cellNumber}-cell`);

    dayGroup.innerHTML = `
      <rect y="${y}" x="${x}" 
      width="${this.dayCellWidth}" 
      height="${this.dayCellHeight}"
      style="${cellStyles}"/></rect>
              
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

class SinglePageCalendar extends Calendar {
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang
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
          ${glyphsSP.months[this.monthCounter]}
          </g>
        </g>

        <g id="year-title">
          <g transform="translate(360 18)">
          ${glyphsSP.years[this.year]}
          </g>
        </g>

        <g id="week-days-titles">
          <g transform="translate(21 67.5) scale(1.5)">
          ${glyphsSP.weekDays.monday}
          </g>
          <g transform="translate(87.8 67.5) scale(1.5)">
          ${glyphsSP.weekDays.tuesday}
          </g>
          <g transform="translate(149 67.5) scale(1.5)">
          ${glyphsSP.weekDays.wednesday}
          </g>
          <g transform="translate(217 67.5) scale(1.5)">
          ${glyphsSP.weekDays.thursday}
          </g>
          <g transform="translate(283 67.5) scale(1.5)">
          ${glyphsSP.weekDays.friday}
          </g>
          <g transform="translate(346 67.5) scale(1.5)">
          ${glyphsSP.weekDays.saturday}
          </g>
          <g transform="translate(411 67.5) scale(1.5)">
           ${glyphsSP.weekDays.sunday}
          </g>
        </g>

          <g id="days-grid"></g>
        `;
      } else if (this.lang === 'en') {
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

class MultiPageCalendar extends Calendar {
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang
  ) {
    super(
      firstMonthIndex,
      year,
      parentContainer,
      controlsContainer,
      cropControlsContainer,
      lang
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

    this.controlsContainer.insertAdjacentElement('afterbegin', this.allPDFDownloadBtn)
    this.controlsContainer.insertAdjacentElement('afterbegin', this.prevBtn)

    this.controlsContainer.insertAdjacentElement('beforeend', this.nextBtn)
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

}

const getButton = document.querySelector("#get-button");
const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");
const multiModeBtn = document.querySelector('#multi-page');

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

  if (multiModeBtn.checked) {

    currentCalendar = new MultiPageCalendar(
      month,
      year,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      "ru"
    );

  } else {

    currentCalendar = new SinglePageCalendar(
      month,
      year,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      "ru"
    );
  }
});
