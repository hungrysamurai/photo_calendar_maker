import opentype from "opentype.js";

import fontsData from "../assets/fontsData.js";

import { SinglePageCalendar } from "./SinglePageCalendar.js";
import { MultiPageCalendar } from "./MultiPageCalendar.js";

const newProjectBtn = document.querySelector("#new-project");
const newProjectContainer = document.querySelector(".new-project-container");

const newCalendarInputsContainer = document.querySelector(
  ".new-calendar-controls"
);

const getButton = document.querySelector("#get-button");

const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");
const multiModeBtn = document.querySelector("#multi-page");
const langInput = document.querySelector("#lang-input");
const fontInput = document.querySelector("#font-input");

const calendarContainer = document.querySelector(".calendar-container");
const controlsContainer = document.querySelector(".controls-container");
const cropControlsContainer = document.querySelector(
  ".crop-controls-container"
);

// Show/Hide "New calendar container"
newProjectBtn.addEventListener("click", () => {
  newProjectContainer.style.top = "-60px";
});

document.addEventListener("click", (e) => {
  if (
    !newCalendarInputsContainer.contains(e.target) &&
    e.target !== newProjectBtn
  ) {
    newProjectContainer.style.top = "0px";
  }
});

/**
 * Current calendar object
 * @type {Object}
 */
let currentCalendar;

getButton.addEventListener("click", () => {
  // Collect data from inputs
  /**
   * @type {number}
   */
  const startYear = +yearInput.value;
  /**
   * @type {number}
   */
  const firstMonthIndex = +monthInput.value;
  /**
   * @type {string}
   */
  const lang = langInput.value;
  /**
   * @type {string}
   */
  const font = fontInput.value;
  /**
   * @type {string}
   */
  const mode = multiModeBtn.checked ? "multi-page" : "single-page";

  /**
   * All values from inputs
   * @type {Object}
   */
  const newCalendarData = { startYear, firstMonthIndex, lang, font, mode };

  // Purge all current content
  calendarContainer.innerHTML = "";

  // If old project in cropper mode - remove cropper
  if (document.querySelector(".cropper-outer-container")) {
    document.querySelector(".cropper-outer-container").remove();
  }

  // Generate new calendar
  newCalendar(newCalendarData);

  // Set new calendar in IDB
  newProjectIDB(newCalendarData);

  // Hide new calendar inputs
  newProjectContainer.style.top = "0px";
});

/**
 * @property {Function} createYearsOptions - Generate years for input (current year + 5)
 * @returns {void}
 */
function createYearsOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  for (let i = 1; i < 5; i++) {
    years.push(new Date().getFullYear() + i);
  }

  yearInput.innerHTML = years
    .map((year) => {
      return `<option value=${year}>${year}</option>`;
    })
    .join("");
}

/**
 * @property {Function} createFontsOptions - Generate fonts options for input
 * @returns {void}
 */
function createFontsOptions() {
  console.log(fontsData);
  const optionsInDOM = Object.keys(fontsData).map(fontName => {

    return `<option value=${fontName}>${fontName}</option>`
  }).join('')

  fontInput.innerHTML = optionsInDOM
}

/**
 * @property {Function} setCurrentMonth - set active option in month input to current month
 * @returns {void}
 */
function setCurrentMonth() {
  const currentMonth = new Date().getMonth();
  monthInput
    .querySelectorAll("option")
  [currentMonth].setAttribute("selected", true);
}

/**
 * @property {Function} loadProject - if some data in IndexedDB - retrieve project. If not - set up IDB schema for project
 * @returns {void}
 */
function loadProject() {
  // Open IDB
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open("Photo Calendar Project", 1);

  request.onsuccess = function () {
    // Check if there any data in DB
    const db = request.result;

    // Init transaction on all stored objects
    const transaction = db.transaction(db.objectStoreNames, "readwrite");

    const dataStore = transaction.objectStore("current_project_data");
    const imagesStore = transaction.objectStore("current_project_images");
    // Get data object
    const query = dataStore.get(0);

    query.onsuccess = async function () {
      // If data...
      if (query.result) {
        const imagesQuery = imagesStore.getAll();

        // Init projects with stored data
        await newCalendar(query.result);

        imagesQuery.onsuccess = function () {
          // If images...
          if (imagesQuery.result.length !== 0) {
            // Retrieve images array via current calendar method
            currentCalendar.retrieveImages(imagesQuery.result);
          }
        };
      }
    };
    transaction.oncomplete = function () {
      db.close();
    };
  };

  // Initially set DB (if there is no IDB yet)
  request.onupgradeneeded = function () {
    const db = request.result;

    // Set data object
    const dataStore = db.createObjectStore("current_project_data", {
      keyPath: "id",
    });

    dataStore.createIndex("firstMonthIndex", ["firstMonthIndex"], {
      unique: false,
    });
    dataStore.createIndex("startYear", ["startYear"], { unique: false });
    dataStore.createIndex("lang", ["lang"], { unique: false });
    dataStore.createIndex("mode", ["mode"], { unique: false });

    // Set images object
    const imagesStore = db.createObjectStore("current_project_images", {
      keyPath: "id",
      autoIncrement: true,
    });

    imagesStore.createIndex("images", ["images"], {
      unique: false,
    });
  };
}

/**
 * @property {Function} newProjectIDB - Set new project in IDB
 * @param {Object} newCalendarData - object with data for calendar
 * @param {number} [newCalendarData.startYear]
 * @param {number} [newCalendarData.firstMonthIndex]
 * @param {string} [newCalendarData.lang]
 * @param {string} [newCalendarData.mode] - single-page/multi-page
 */
function newProjectIDB({ startYear, firstMonthIndex, lang, font, mode }) {
  // Open IDB
  const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  const request = indexedDB.open("Photo Calendar Project", 1);

  request.onsuccess = function () {
    const db = request.result;

    const transaction = db.transaction(db.objectStoreNames, "readwrite");

    const dataStore = transaction.objectStore("current_project_data");
    const imagesStore = transaction.objectStore("current_project_images");

    // Add new data to db
    dataStore.put({
      id: 0,
      startYear,
      firstMonthIndex,
      lang,
      mode,
      font
    });

    // Remove old images
    imagesStore.clear();

    transaction.oncomplete = function () {
      db.close();
    };
  };
}

/**
 * @async
 * @property {Function} newCalendar - Init new calendar in DOM
 * @param {Object} newCalendarData - object with data for calendar
 * @param {number} [newCalendarData.startYear]
 * @param {number} [newCalendarData.firstMonthIndex]
 * @param {string} [newCalendarData.lang]
 * @param {string} [newCalendarData.mode] - single-page/multi-page
 */
async function newCalendar({ startYear, firstMonthIndex, lang, font, mode }) {

  const {
    fontNameBold,
    fontNameRegular,
    manualXCoordsMultiPage,
    manualXCoordsSinglePage
  } = fontsData[font]

  const baseName =
    process.env.NODE_ENV === "production"
      ? "/projects/photo_calendar_maker/"
      : "/";

  const fontBoldBuffer = fetch(`${baseName}${fontNameBold}.ttf`);
  const fontMeiumBuffer = fetch(`${baseName}${fontNameRegular}.ttf`);

  const requests = await Promise.all([fontBoldBuffer, fontMeiumBuffer]).then((requestsArray) => {
    const results = requestsArray.map(async (req) => {
      const buffer = req.arrayBuffer();
      return opentype.parse(await buffer);
    });
    return results;
  });

  const fontsArray = await Promise.all(requests);

  if (mode === "multi-page") {
    currentCalendar = new MultiPageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      mode,
      fontsArray,
      manualXCoordsMultiPage
    );
  } else {
    currentCalendar = new SinglePageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      mode,
      fontsArray,
      manualXCoordsSinglePage
    );
  }
}

// Init
loadProject();

createYearsOptions();
createFontsOptions();
setCurrentMonth();

