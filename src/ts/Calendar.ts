import Cropper from "cropperjs";
import SVGtoPDF from "svg-to-pdfkit";

import BlobStream from "blob-stream";
import PDFDocument from "pdfkit/js/pdfkit.standalone";

import { getMonthsList } from "./utils/getMonthsList";
import { createHTMLElement } from "./utils/createElement/createHTMLElement";

/**
 * Object with SVG icons
 */
import { icons } from "../assets/icons";
import { outputFormats } from "../assets/outputFormats";

import {
  FormatNames,
  CalendarType,
  CalendarLanguage,
  LoadingState,
  PDFPagesRangeToDownload,
} from "../../types.d";

/**
 * Class that includes basic logic of calendar grid creation, methods to init basic DOM elements, upload/download documents (single), Cropper functionality, image compression, saving to IndexedDB (single) and loader
 */
export abstract class Calendar {
  static _currentCalendar: Calendar;

  static get current(): Calendar {
    return Calendar._currentCalendar;
  }

  static set current(calendar: Calendar) {
    Calendar._currentCalendar = calendar;
  }

  static loadingScreen: HTMLDivElement;
  /**
   * @property {Fucntion} createLoader - creates loader element
   */
  static createLoader(element: HTMLElement): void {
    Calendar.loadingScreen = createHTMLElement({
      elementName: "div",
      className: "loading-screen hide",
      content: icons.loader,
      insertTo: {
        element,
        position: "beforebegin",
      },
    });
  }

  /**
   * @property {Fucntion} loading - toggle visibility of    loader element
   * @param {string} state
   * @returns {void}
   */
  static loading(state: LoadingState): void {
    if (Calendar.current) {
      if (state === LoadingState.Hide) {
        this.loadingScreen.classList.add("hide");
        Calendar.current.controlsContainer.style.pointerEvents = "auto";
      } else if (state === LoadingState.Show) {
        this.loadingScreen.classList.remove("hide");
        Calendar.current.controlsContainer.style.pointerEvents = "none";
      }
    }
  }

  static isNewType: boolean = true;

  /**
   * Dimensions of document (px)
   */
  static outputDimensions: OutputDimensions = outputFormats;
  static currentSize: FormatNames = FormatNames.A4;

  static currentPDFDownloadBtn: HTMLButtonElement;
  static jpgDownloadBtn: HTMLButtonElement;
  static formatSelectInput: HTMLSelectElement;
  static cropBtn: HTMLButtonElement;
  static uploadImgInput: HTMLInputElement;
  static uploadImgBtn: HTMLLabelElement;

  static basicControls: HTMLElement[] = [];

  static cropperOuter: HTMLDivElement;
  static cropper: Cropper | undefined;
  static imageToCrop: SVGImageElement;
  static tempCropImageElement: HTMLImageElement;
  static applyCropBtn: HTMLButtonElement;
  static cancelCropBtn: HTMLButtonElement;

  // Set fonts object
  fonts: FontData = {};

  currentMonth: number = 0;
  monthsNamesList: ReturnType<typeof getMonthsList>;
  monthCounter: number;
  firstMonth: number;

  // Rate to reduce uploading images size
  imageReduceSizeRate: number = 15;
  startYear: number;
  lastMonth: number;
  endYear: number;

  calendarInner: HTMLDivElement;

  imagePlaceholderWidth: number;
  imagePlaceholderHeight: number;
  imagePlaceholderX: number;
  imagePlaceholderY: number;

  pagesArray: SVGElement[];

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
    // Add subfamilies to fonts object
    for (let i = 0; i < currentFont.length; i++) {
      this.fonts[currentFont[i]?.names?.fontSubfamily.en.toLowerCase()] =
        currentFont[i];
    }

    this.monthsNamesList = getMonthsList(this.lang);

    /**
     * Counter of months
     */
    this.monthCounter = this.firstMonthIndex;

    /**
     * Capture initial first month & year
     */
    this.firstMonth = this.firstMonthIndex;
    this.startYear = this.year;

    if (!Calendar.current) {
      Calendar.createLoader(parentContainer);
      Calendar.initBasicControls(controlsContainer);
      Calendar.initBasicControlsEvents();

      Calendar.initCropperControls(cropControlsContainer);
    } else {
      // Check new type vs old type
      Calendar.isNewType = type !== Calendar.current.type;
    }

    Calendar.current = this;
  }

  /**
   * @property {Function} initBasicControls - creates controls buttons in DOM
   */
  static initBasicControls(controlsContainer: HTMLDivElement): void {
    controlsContainer.innerHTML = "";

    this.currentPDFDownloadBtn = createHTMLElement({
      elementName: "button",
      parentToAppend: controlsContainer,
      id: "pdf-download-current",
      content: icons.pdfSingle,
    });

    this.basicControls.push(this.currentPDFDownloadBtn);

    this.jpgDownloadBtn = createHTMLElement({
      elementName: "button",
      parentToAppend: controlsContainer,
      id: "jpg-download",
      content: icons.jpg,
    });

    this.basicControls.push(this.jpgDownloadBtn);

    this.formatSelectInput = createHTMLElement({
      elementName: "select",
      id: "format-select",
      parentToAppend: controlsContainer,
    });

    const formats = Object.keys(this.outputDimensions);

    for (const format of formats) {
      const optionEl = createHTMLElement({
        elementName: "option",
        text: format,
        attributes: {
          value: format,
        },
      });

      if (format === this.currentSize) {
        optionEl.selected = true;
      }

      this.formatSelectInput.append(optionEl);
    }

    this.basicControls.push(this.formatSelectInput);

    this.cropBtn = createHTMLElement({
      elementName: "button",
      id: "crop-btn",
      content: icons.crop,
      parentToAppend: controlsContainer,
    });

    this.basicControls.push(this.cropBtn);

    this.uploadImgInput = createHTMLElement({
      elementName: "input",
      id: "upload-input",
      parentToAppend: controlsContainer,
      attributes: {
        type: "file",
        accept: "image/jpeg, image/png, image/jpg",
        hidden: new Boolean(true).toString(),
        onclick: "this.value=null;",
      },
    });

    this.basicControls.push(this.uploadImgInput);

    this.uploadImgBtn = createHTMLElement({
      elementName: "label",
      id: "upload-btn",
      content: icons.upload,
      className: "upload-btn",
      parentToAppend: controlsContainer,
      attributes: {
        for: "upload-input",
      },
    });

    this.basicControls.push(this.uploadImgBtn);
  }

  /**
   * @property {Function} initBasicControlsEvents - sets events on buttons
   */
  static initBasicControlsEvents(): void {
    this.currentPDFDownloadBtn.addEventListener("click", () => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.downloadPDF(PDFPagesRangeToDownload.Current);
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
        Calendar.loading(LoadingState.Show);

        this.imageToCrop = currentImageElement as SVGImageElement;
        this.initCropper();
        this.current.cropControlsContainer.classList.remove("hide");
      }
    });

    this.uploadImgInput.addEventListener("input", (e) => {
      if (this.cropper) {
        this.removeCropper();
      }

      this.uploadImg(e);
    });

    this.formatSelectInput.addEventListener("input", (e) => {
      this.currentSize = (e.target as HTMLInputElement).value as FormatNames;
    });
  }

  // Upload/download section

  /**
   * @property {Function} uploadImg - Upload single image
   * @param {e} e - Event object that fires when upload single image button pressed
   */
  static uploadImg(e: Event) {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const imageFile = e.target.files[0];

      const reader = new FileReader();

      reader.onload = (e) => {
        const imageGroup = this.getCurrentMockup("#image-group");

        const imageEl = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "image"
        );

        imageEl.setAttribute(
          "height",
          this.current.imagePlaceholderHeight.toString()
        );
        imageEl.setAttribute(
          "width",
          this.current.imagePlaceholderWidth.toString()
        );
        imageEl.setAttribute("x", this.current.imagePlaceholderX.toString());
        imageEl.setAttribute("y", this.current.imagePlaceholderY.toString());

        // Image optimization
        const reduced = this.reduceImageSize(
          reader.result as string,
          this.current.imagePlaceholderWidth * this.current.imageReduceSizeRate,
          this.current.imagePlaceholderHeight * this.current.imageReduceSizeRate
        );

        reduced.then((reducedImage) => {
          const resultImage = reducedImage ? reducedImage : reader.result;
          imageEl.setAttributeNS(
            "http://www.w3.org/1999/xlink",
            "href",
            resultImage as string
          );
          imageGroup.innerHTML = "";
          imageGroup.appendChild(imageEl);

          Calendar.loading(LoadingState.Hide);
          // Save image to IDB
          this.current.saveToIDB(resultImage);
        });
      };

      Calendar.loading(LoadingState.Show);
      reader.readAsDataURL(imageFile);
    }
  }

  /**
   * @async
   * @property {Function} reduceImageSize - Reduce image file size & resolution
   * @param {string} base64Str - Base64 string - image file
   * @param {number} maxWidth - max width of image is equal to width of svg-placeholder times imageReduceSizeRate
   * @param {number} maxHeight - max height of image is equal to height of svg-placeholder times imageReduceSizeRate
   */
  static async reduceImageSize(
    base64Str: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<void | string> {
    return new Promise((resolve) => {
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
        let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(img, 0, 0, width, height);
        // Return reduced image
        resolve(canvas.toDataURL("image/jpeg"));
      };
    });
  }

  /**
   * @property {Function} downloadCurrentJPG - Download current (visible) svg mockup
   */
  static downloadCurrentJPG(): void {
    const svg = this.getCurrentMockup("svg");
    const svgData = new XMLSerializer().serializeToString(svg);

    const canvas = document.createElement("canvas");
    canvas.width = this.outputDimensions[this.currentSize].width;
    canvas.height = this.outputDimensions[this.currentSize].height;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    // SVG attributes fix for proper rasterization
    let properAttributes: string;

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
   * @param {string} range - single-page/all pages
   */
  static downloadPDF(range: PDFPagesRangeToDownload): void {
    Calendar.loading(LoadingState.Show);
    let pagesArray: SVGElement[] = [];

    const doc = new PDFDocument({ size: this.currentSize });
    const stream = doc.pipe(BlobStream());

    if (range === PDFPagesRangeToDownload.Current) {
      pagesArray.push(this.getCurrentMockup("svg"));
      doc.info["Title"] = this.getFileName();
    }

    if (range === PDFPagesRangeToDownload.All) {
      pagesArray = this.current.pagesArray;
      doc.info["Title"] = this.getFileName(true);
    }

    pagesArray.forEach((page, i) => {
      SVGtoPDF(doc, page, 0, 0);

      if (i !== pagesArray.length - 1) doc.addPage();
    });

    doc.end();

    stream.on("finish", () => {
      Calendar.loading(LoadingState.Hide);
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
   * @param {boolean} span
   */
  static getFileName(span?: boolean): string {
    if (span || this.current.type === CalendarType.SinglePage) {
      const firstMonth = this.current.firstMonth;
      const firstMonthYear = this.current.startYear;

      const date1 = new Date(Number(firstMonthYear), Number(firstMonth));
      const firstMonthName = date1.toLocaleString("default", { month: "long" });

      const lastMonth = this.current.lastMonth;
      const lastMonthYear = this.current.endYear;

      const date2 = new Date(+lastMonthYear, +lastMonth);
      const lastMonthName = date2.toLocaleString("default", {
        month: "long",
      });

      return `${firstMonthName}_${firstMonthYear}-${lastMonthName}_${lastMonthYear}`;
    }

    const currentMonthContainer = Calendar.getCurrentMockup();

    const year = currentMonthContainer.dataset.year;
    const month = currentMonthContainer.dataset.month;

    const date = new Date(Number(year), Number(month));
    const monthName = date.toLocaleString("default", { month: "long" });

    return `${monthName}_${year}`;
  }

  // Crop functionality section

  /**
   * @property {Function} initCropper - create Cropper object, initCropper on current svg mockup image element
   */
  static initCropper(): void {
    const imageFile = this.imageToCrop.getAttribute("href") as string;

    fetch(imageFile)
      .then((res) => res.blob())
      .then((imageFile) => {
        // Position cropper element on top of placeholder
        this.updateCropperPosition();

        this.tempCropImageElement = createHTMLElement({
          elementName: "img",
          className: "image-element",
          parentToAppend: this.cropperOuter,
          attributes: {
            src: URL.createObjectURL(imageFile),
          },
        });

        this.imageToCrop.style.visibility = "hidden";

        this.cropper = new Cropper(this.tempCropImageElement, {
          viewMode: 0,
          dragMode: "none",
          modal: false,
          background: false,
          autoCropArea: 1,
          ready: () => {
            if (this.cropper) {
              this.cropper.initialZoomRatio =
                this.cropper.getCanvasData().width /
                this.cropper.getCanvasData().naturalWidth;
            }

            window.onresize = () => {
              this.updateCropperPosition();
            };
            Calendar.loading(LoadingState.Hide);
          },

          zoom: (e) => {
            if (this.cropper) {
              this.cropper.crop();
              this.cropper.setAspectRatio(0);

              this.cropper.setCropBoxData({
                width: this.cropper.getContainerData().width,
                height: this.cropper.getContainerData().height,
              });

              if (e.detail.ratio < e.detail.oldRatio) {
                if (
                  this.cropper.getCanvasData().width - 10 <
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
            }
          },
        });
      });
  }

  /**
   * @property {Function} updateCropperPosition - Properly position Cropper element on top of image
   * @param {HTMLElement} currentImageElement
   */
  static updateCropperPosition(): void {
    if (this.cropperOuter) {
      const { left, top, width, height } =
        this.imageToCrop.getBoundingClientRect();

      this.cropperOuter.style.position = "absolute";
      this.cropperOuter.style.left = `${left}px`;
      this.cropperOuter.style.top = `${top}px`;
      this.cropperOuter.style.width = `${width}px`;
      this.cropperOuter.style.height = `${height}px`;
    }
  }

  /**
   * @property {Fucntion} applyCrop - apply crop and save cropped image
   */
  static applyCrop(): void {
    if (this.cropper) {
      const canvas = this.cropper.getCroppedCanvas({
        minWidth: 256,
        minHeight: 256,
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: "white",
      });

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
      ctx.drawImage(canvas, 0, 0);

      const resultURL = canvas.toDataURL("image/jpeg");

      this.imageToCrop.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        resultURL
      );
      // Save cropped image to IDB
      this.current.saveToIDB(resultURL);
      // Get rid of cropper
      this.removeCropper();
    }
  }

  /**
   * @property {Fucntion} removeCropper - deactivate and destroy Cropper and its DOM elements
   */
  static removeCropper(): void {
    if (this.cropper) {
      const currentImageElement = Calendar.getCurrentMockup("image");

      currentImageElement.style.visibility = "visible";
      this.cropper.destroy();
      this.cropper = undefined;
      this.cropperOuter.innerHTML = "";

      URL.revokeObjectURL(this.tempCropImageElement.src);
      this.tempCropImageElement.remove();

      this.current.cropControlsContainer.classList.add("hide");
    }
  }

  /**
   * @property {Function} initCropperControls - Create Cropper buttons in DOM
   */
  static initCropperControls(cropControlsContainer: HTMLDivElement): void {
    this.cropperOuter = createHTMLElement({
      elementName: "div",
      className: "cropper-outer-container",
      parentToAppend: document.body,
    });

    this.applyCropBtn = createHTMLElement({
      elementName: "button",
      id: "apply-crop",
      content: icons.done,
      parentToAppend: cropControlsContainer,
    });

    this.cancelCropBtn = createHTMLElement({
      elementName: "button",
      id: "cancel-crop",
      content: icons.cancel,
      parentToAppend: cropControlsContainer,
    });

    this.applyCropBtn.addEventListener("click", () => {
      this.applyCrop();
    });

    this.cancelCropBtn.addEventListener("click", () => {
      this.removeCropper();
    });
  }

  /**
   * @property {Function} getCurrentMockup - Get current mockup to manipulate
   * @param {string} [element=""] element - selector string to pick specific element e.g. 'image' or 'svg'
   */
  static getCurrentMockup(element: string = ""): SVGElement | SVGImageElement {
    if (this.current.type === CalendarType.MultiPage) {
      return this.current.calendarInner.querySelector(
        `#month-${this.current.currentMonth}-container ${element}`
      ) as SVGElement;
    }

    return this.current.calendarInner.querySelector(
      `#mockup-container ${element}`
    ) as SVGElement;
  }

  // Calendar grid generate section

  /**
   * @property {Function} getOutline - create outline (<path> element) from given string, and set it x-coords, y-coords, size and fill
   * @param {string} string - text to outline
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {HTMLElement} - <path>
   */
  getOutline(string, x, y, fontSize, fontWeight = "bold", fill = "#231f20") {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);
    outline.fill = fill;
    return outline.toSVG();
  }

  /**
   * @property {Function} getAndPlaceOutline - creates path for individual day digit in calendar grid
   * @param {string} string - text to outline (number as string)
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {HTMLElement} - <path>
   */
  getAndPlaceOutline(
    string,
    x,
    y,
    fontSize,
    fontWeight = "bold",
    fill = "#231f20"
  ) {
    const outline = this.fonts[fontWeight].getPath(string, x, y, fontSize);

    const { x1, x2, y1, y2 } = outline.getBoundingBox();

    const xShift = Number(((x2 - x1) / 2).toFixed(2));
    const yShift = Number(((y2 - y1) / 2).toFixed(2));

    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    pathElement.setAttribute("d", outline.toPathData());
    pathElement.setAttribute("transform", `translate(-${xShift} ${yShift})`);
    pathElement.setAttribute("fill", fill);

    return pathElement;
  }

  /**
   * @property {Function} getWeekDays - generates array of week days
   * @param {string} - length of week day name
   * @returns {Array}
   */
  getWeekDays(length) {
    return Array.from({ length: 7 }, (_, i) => {
      let weekDay = new Intl.DateTimeFormat(this.lang, {
        weekday: length,
      }).format(new Date(0, 0, i + 1));
      // Capitalize first letters
      if (this.lang === "ru") {
        weekDay = weekDay[0].toUpperCase() + weekDay.slice(1);
      }
      return weekDay;
    });
  }

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
    fontSize,
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
      cellsTextFields[currentDayIndex].appendChild(
        this.getAndPlaceOutline(
          `${i}`,
          this.dayCellWidth / 2,
          this.dayCellHeight / 2,
          fontSize
        )
      );

      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].appendChild(
          this.getAndPlaceOutline(
            `${prevMonthDaysCount}`,
            this.dayCellWidth / 2,
            this.dayCellHeight / 2,
            fontSize,
            "regular",
            "#999"
          )
        );

        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].appendChild(
          this.getAndPlaceOutline(
            `${i}`,
            this.dayCellWidth / 2,
            this.dayCellHeight / 2,
            fontSize,
            "regular",
            "#999"
          )
        );

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
      </g>
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

  abstract retrieveImages(imagesArr: ImageObject[]): void;
  abstract initDOMSVG(): void;
  // abstract rebuildControls(): void;
}
