import Cropper from "cropperjs";
import SVGtoPDF from "svg-to-pdfkit";
/**
 * Object with SVG icons
 */
import { icons } from "../assets/icons.js";

/**
 * Class that includes basic logic of calendar grid creation, methods to init basic DOM elements, upload/download documents (single), Cropper functionality, image compression, saving to IndexedDB (single) and loader
 */
export class Calendar {

  /**
   * 
   * @param {number} firstMonthIndex 
   * @param {number} year 
   * @param {HTMLElement} parentContainer 
   * @param {HTMLElement} controlsContainer 
   * @param {HTMLElement} cropControlsContainer 
   * @param {string} lang 
   * @param {string} type 
   */
  constructor(
    firstMonthIndex,
    year,
    parentContainer,
    controlsContainer,
    cropControlsContainer,
    lang,
    type
  ) {
    this.firstMonthIndex = firstMonthIndex;
    this.year = year;
    this.parentContainer = parentContainer;
    this.controlsContainer = controlsContainer;
    this.cropControlsContainer = cropControlsContainer;
    this.lang = lang;
    this.type = type;

    /**
     * Dimensions of document (px)
     * @type {Object}
     */
    this.outputDimensions = {
      A5: { width: 1748, height: 2480 },
      A4: { width: 2480, height: 3508 },
      A3: { width: 3508, height: 4961 },
    };
    this.currentSize = "A4";
    this.currentMonth = 0;

    // Month counters
    /**
     * Counter of months
     * @type {number}
     */
    this.monthCounter = this.firstMonthIndex;

    /**
     * Capture initial first momnth
     * @type {number}
     */
    this.firstMonth = this.firstMonthIndex;

    // Rate to reduce uploading images size
    this.reduceRate = 15;

    this.startYear = this.year;
    this.lastMonth;
    this.endYear;
  }
  // DOM insertion section

  /**
   * @property {Function} initBasicControls - creates controls buttons in DOM
   * @returns {void}
   */
  initBasicControls() {
    this.controlsContainer.innerHTML = `
      <button id="pdf-download-current">
        ${icons.pdfSingle}
      </button>
     
      <button id="jpg-download">
       ${icons.jpg}
      </button>
  
        <select id="format-select">

       </select>

    <button id="crop-btn">
      ${icons.crop}
    </button>

    <input
      type="file"
      id="upload-input"
      accept="image/jpeg, image/png, image/jpg"
      hidden
      onclick="this.value=null;"/>
          
      <label for="upload-input" id="upload-btn" class="upload-btn">
        ${icons.upload}
      </label>
    `;

    // Set formats
    this.formatSelectInput =
      this.controlsContainer.querySelector("#format-select");

    const formats = Object.keys(this.outputDimensions);

    for (const format of formats) {
      const optionEl = document.createElement("option");
      optionEl.setAttribute("value", format);
      optionEl.textContent = format;

      if (format === this.currentSize) optionEl.selected = true;
      this.formatSelectInput.append(optionEl);
    }

    this.currentPDFDownloadBtn = this.controlsContainer.querySelector(
      "#pdf-download-current"
    );
    this.jpgDownloadBtn = this.controlsContainer.querySelector("#jpg-download");
    this.uploadImgBtn = this.controlsContainer.querySelector("#upload-btn");

    this.cropBtn = this.controlsContainer.querySelector("#crop-btn");
    this.uploadImgInput = this.controlsContainer.querySelector("#upload-input");
  }

  /**
   * @property {Function} initBasicControlsEvents - sets events on buttons
   * @returns {void}
   */
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

      const currentImageElement = this.getCurrentMockup("image");

      if (currentImageElement) {
        this.loading("show");
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

    this.formatSelectInput.addEventListener("input", (e) => {
      this.currentSize = e.target.value;
    });
  }

  // Upload/download section

  /**
   * @property {Function} uploadImg - Upload single image
   * @param {Event Object} e - Event object that fires when upload single image button pressed
   * @returns {void}
   */
  uploadImg(e) {
    if (!e.target.files[0]) return;
    const imageFile = e.target.files[0];

    const reader = new FileReader();

    reader.onload = (e) => {
      const imageGroup = this.getCurrentMockup("#image-group");
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

      reduced.then((reducedImage) => {
        const resultImage = reducedImage ? reducedImage : e.target.result;
        imageEl.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          resultImage
        );
        imageGroup.innerHTML = "";
        imageGroup.appendChild(imageEl);
        this.loading("hide");
        // Save image to IDB
        this.saveToIDB(resultImage);
      });
    };
    this.loading("show");
    reader.readAsDataURL(imageFile);
  }

  /**
   * @property {Function} reduceImageSize - Reduce image file size & resolution
   * @param {string} base64Str - Base64 string - image file
   * @param {number} maxWidth - max width of image is equal to width of svg-placeholder times reduceRate
   * @param {number} maxHeight - max height of image is equal to height of svg-placeholder times reduceRate
   * @returns {Promise} - Promise object of resized image
   */
  async reduceImageSize(base64Str, maxWidth, maxHeight) {
    let resized_base64 = await new Promise((resolve) => {
      let img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width <= maxWidth && height <= maxHeight) {
          // If resolution of image is less than actual placeholder size
          resolve();
        }

        let canvas = document.createElement("canvas");
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
        let ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        // Return reduced image
        resolve(canvas.toDataURL("image/jpeg"));
      };
    });
    return resized_base64;
  }

  /**
   * @property {Function} downloadCurrentJPG - Download current (visible) svg mockup
   * @returns {void}
   */
  downloadCurrentJPG() {
    const svg = this.getCurrentMockup("svg");
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    canvas.width = this.outputDimensions[this.currentSize].width;
    canvas.height = this.outputDimensions[this.currentSize].height;
    const ctx = canvas.getContext("2d");

    // SVG attributes fix for proper rasterization
    let properAttributes;

    properAttributes = svgData.replace(
      `viewBox="0 0 210 297"`,
      `width="210" height="297" version="1.1"`
    );

    const img = new Image();
    img.setAttribute(
      "src",
      "data:image/svg+xml;base64," + btoa(properAttributes)
    );

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

  /**
   * @property {Function} downloadPDF - download as PDF
   * @param {string} amount - single-page/all pages
   * @returns {void}
   */
  downloadPDF(amount) {
    this.loading("show");
    let pagesArray = [];

    const doc = new PDFDocument({ size: this.currentSize });
    const stream = doc.pipe(blobStream());

    if (amount === "current") {
      pagesArray.push(this.getCurrentMockup("svg"));
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

    stream.on("finish", () => {
      this.loading("hide");
      const url = stream.toBlobURL("application/pdf");

      const a = document.createElement("a");
      const my_evt = new MouseEvent("click");
      a.download = doc.info["Title"];
      a.href = url;
      a.dispatchEvent(my_evt);
    });
  }

  /**
   * @property {Function} getFileName - Generates name of file
   * @param {string} span 
   * @returns {string} - name of downloading file
   */
  getFileName(span) {
    if (span || this.type === "single-page") {
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

    const currentMonthContainer = this.getCurrentMockup();

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(+year, +month);
    const monthName = date.toLocaleString("default", { month: "long" });

    return `${monthName}_${year}`;
  }

  // Crop functionality section

  /**
   * @property {Function} initCropper - create Cropper object, initCropper on current svg mockup image element
   * @param {HTMLElement} currentImageElement 
   * @returns {void}
   */
  initCropper(currentImageElement) {
    const imageFile = currentImageElement.getAttribute("href");

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        this.cropperOuter = document.createElement("div");
        this.cropperOuter.classList.add("cropper-outer-container");

        // Position cropper element on top of placeholder
        this.updateCropperPosition(currentImageElement);

        const imageElement = document.createElement("img");
        imageElement.classList.add("image-element");
        imageElement.src = URL.createObjectURL(imageFile);

        this.cropperOuter.appendChild(imageElement);
        document.body.append(this.cropperOuter);

        currentImageElement.style.display = "none";

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

            this.cropper.initialZoomRatio =
              this.cropper.getCanvasData().width /
              this.cropper.getCanvasData().naturalWidth;

            window.onresize = () => {
              this.updateCropperPosition(currentImageElement);
            };
            this.loading("hide");
          },

          zoom: (e) => {
            this.cropper.crop();
            this.cropper.setAspectRatio(0);

            this.cropper.setCropBoxData({
              width: this.cropper.getContainerData().width,
              height: this.cropper.getContainerData().height,
            });

            if (e.detail.ratio < e.detail.oldRatio) {
              if (
                this.cropper.canvasData.width - 10 <
                this.cropper.initialCanvasData.width
              ) {
                this.cropper.reset();
              }
            }

            this.cropper.zoomRatio =
              this.cropper.getCanvasData().width /
              this.cropper.getCanvasData().naturalWidth;

            if (
              this.cropper.zoomRatio.toFixed(5) >
              this.cropper.initialZoomRatio.toFixed(5)
            ) {
              this.cropper.setDragMode("move");
              this.cropper.options.viewMode = 3;
            } else {
              this.cropper.setDragMode("none");
              this.cropper.options.viewMode = 0;
            }
          },
        });
      });
  }

  /**
   * @property {Function} updateCropperPosition - Properly position Cropper element on top of image
   * @param {HTMLElement} currentImageElement
   * @returns {void}
   */
  updateCropperPosition(currentImageElement) {
    if (this.cropperOuter) {
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
  }

  /**
   * @property {Fucntion} applyCrop - apply crop and save cropped image
   * @param {HTMLElement} currentImageElement 
   * @returns {void}
   */
  applyCrop(currentImageElement) {
    const canvas = this.cropper.getCroppedCanvas({
      minWidth: 256,
      minHeight: 256,
      maxWidth: 4096,
      maxHeight: 4096,
      fillColor: "white",
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
    // Save cropped image to IDB
    this.saveToIDB(resultURL);
    // Get rid of cropper
    this.removeCropper();
  }

  /**
  * @property {Fucntion} removeCropper - deactivate and destroy Cropper and its DOM elements
  * @returns {void}
  */
  removeCropper() {
    const currentImageElement = this.getCurrentMockup("image");

    currentImageElement.style.display = "block";
    this.cropper.destroy();
    this.cropper = undefined;
    this.cropperOuter.remove();
    this.cropperOuter = undefined;

    this.cropControlsContainer.innerHTML = "";
  }

  /**
   * @property {Function} initCropperControls - Create Cropper buttons in DOM
   * @returns {void}
   */
  initCropperControls() {
    this.cropControlsContainer.innerHTML = `
      <button id="apply-crop">
        ${icons.done}
    </button>
      <button id="cancel-crop">
        ${icons.cancel}
      </button>
    `;

    this.applyCropBtn = this.cropControlsContainer.querySelector("#apply-crop");
    this.cancelCropBtn =
      this.cropControlsContainer.querySelector("#cancel-crop");

    this.cancelCropBtn.addEventListener("click", () => {
      this.removeCropper();
    });
  }

  /**
   * @property {Function} getCurrentMockup - Get current mockup to manipulate
   * @param {string} [element=""] element - selector string to pick specific element
   * @returns {HTMLElement} - DOM element to manipulate
   */
  getCurrentMockup(element = "") {
    if (this.type === "multi-page") {
      return this.calendarInner.querySelector(
        `#month-${this.currentMonth}-container ${element}`
      );
    } else if (this.type === "single-page") {
      return this.calendarInner.querySelector(`#mockup-container ${element}`);
    }
  }

  // Calendar grid generate section

  /**
   * @property {Function} createMonthGrid - Generates month grid in given DOM element with provided parameters
   * @param {HTMLElement} monthGrid - element to append calendar grid 
   * @param {number} startIndex - first day of month
   * @param {number} totalDays - number of days in current month 
   * @param {number} prevMonthDaysNumber - number of days in prev month 
   * @param {number} initialX - initial X coords to place day cell
   * @param {number} initialY - initial Y coords to place day cell
   * @param {Object} glyphsSet - Object with SVG glyphs 
   * @param {string} cellStyles - additional styles for each day cell
   * @returns {void} 
   */
  createMonthGrid(
    monthGrid,
    startIndex,
    totalDays,
    prevMonthDaysNumber,
    initialX,
    initialY,
    glyphsSet,
    cellStyles
  ) {
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

  /**
   * @property {Function} createDayCell - Create individual day cell
   * @param {number} x - x coordinate of cell 
   * @param {number} y - y coordinate of cell 
   * @param {number} cellNumber - number of day 
   * @param {string} cellStyles - addition CSS styles for cell 
   * @returns {HTMLElement} - DOM element of cell
   */
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

  // Date functions section

  /**
   * @property {Function} daysInMonth - gives number of days in current month 
   * @param {number} month - given month 
   * @param {number} year - given year 
   * @returns {number} - total number of days in given month
   */
  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * @property {Function} getFirstDay - gives position of first day on month
   * @param {number} month 
   * @param {number} year 
   * @returns {number}
   */
  getFirstDay(month, year) {
    let index = new Date(year, month, 1);
    if (index.getDay() === 0) {
      return 7;
    }
    return index.getDay();
  }

  // Loader section

  /**
   * @property {Fucntion} createLoader - creates loader element
   * @returns {void}
   */
  createLoader() {
    this.loadingScreen = document.createElement("div");
    this.loadingScreen.classList.add("loading-screen");
    this.loadingScreen.classList.add("hide");

    this.loadingScreen.innerHTML = icons.loader;

    this.parentContainer.insertAdjacentElement(
      "beforebegin",
      this.loadingScreen
    );
  }

  /**
   * @property {Fucntion} loading - toggle visibility of loader element
   * @param {string} action 
   * @returns {void}
   */
  loading(action) {
    if (action === "hide") {
      this.loadingScreen.classList.add("hide");
      this.controlsContainer.style.pointerEvents = "auto";
    } else if (action === "show") {
      this.loadingScreen.classList.remove("hide");
      this.controlsContainer.style.pointerEvents = "none";
    }
  }

  /**
   * @property {Function} saveToIDB - save current image to IndexedDB
   * @param {string} imageFile - image to save in IndexedDB
   * @param {number} [id=this.currentMonth] - index of month
   */
  saveToIDB(imageFile, id = this.currentMonth) {
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB;

    const request = indexedDB.open("Photo Calendar Project", 1);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("current_project_images", "readwrite");
      const store = transaction.objectStore("current_project_images");

      store.put({
        id: id,
        image: imageFile,
      });

      transaction.oncomplete = function () {
        db.close();
      };
    };
  }
}
