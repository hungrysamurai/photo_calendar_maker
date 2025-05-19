import { SinglePageCalendar } from "./SinglePageCalendar";
import { MultiPageCalendar } from "./MultiPageCalendar";
import { Calendar } from "./Calendar";

import { collectDataFromInputs } from "./utils/collectDataFromInputs";

import { createYearsOptions } from "./utils/initializers/createYearsOptions";
import { createFontsOptions } from "./utils/initializers/createFontsOptions";
import { createMonthsOptions } from "./utils/initializers/createMonthsOptions";
import { createFormatsOptions } from "./utils/initializers/createFormatsOptions";

import { loadFonts } from "./utils/initializers/loadFonts";

import { CalendarType } from "../../types";

const newProjectContainer = document.querySelector(
  ".new-project-container"
) as HTMLDivElement;
const newProjectBtn = document.querySelector(
  "#new-project"
) as HTMLButtonElement;

const newCalendarInputsContainer = document.querySelector(
  ".new-calendar-controls"
) as HTMLDivElement;

const getButton = document.querySelector("#get-button") as HTMLButtonElement;

const monthInput = document.querySelector("#month-input") as HTMLSelectElement;
const yearInput = document.querySelector("#year-input") as HTMLSelectElement;
const multiModeBtn = document.querySelector("#multi-page") as HTMLInputElement;
const langInput = document.querySelector("#lang-input") as HTMLSelectElement;
const fontInput = document.querySelector("#font-input") as HTMLSelectElement;
const formatInput = document.querySelector(
  "#format-input"
) as HTMLSelectElement;

const calendarContainer = document.querySelector(
  ".calendar-container"
) as HTMLDivElement;
const controlsContainer = document.querySelector(
  ".controls-container"
) as HTMLDivElement;
const cropControlsContainer = document.querySelector(
  ".crop-controls-container"
) as HTMLDivElement;

// Globals
let currentCalendar: Calendar;
let loadedFonts: LoadedFontsObject;

/**
 * @property {Function} newProject - generate new calendar from inputs
 */
function newProject() {
  const newCalendarData: CalendarData = collectDataFromInputs(
    yearInput,
    monthInput,
    langInput,
    fontInput,
    formatInput,
    multiModeBtn
  );

  // Purge all current content
  calendarContainer.innerHTML = "";

  // Generate new calendar
  newCalendar(newCalendarData);

  // Set new calendar in IDB
  newProjectIDB(newCalendarData);

  // Hide new calendar inputs
  newProjectContainer.style.top = "0px";
}

/**
 * @async
 * @property {Function} newCalendar - Init new calendar in DOM
 * @param {Object} newCalendarData - object with data for calendar
 * @param {number} [newCalendarData.startYear]
 * @param {number} [newCalendarData.firstMonthIndex]
 * @param {string} [newCalendarData.lang]
 * @param {string} [newCalendarData.type] - single-page/multi-page
 */
async function newCalendar(
  { startYear, firstMonthIndex, lang, font, format, type }: CalendarData,
  savedImages?: ImageObject[]
): Promise<void> {
  const currentFont: FontArray = loadedFonts[font];

  if (type === CalendarType.MultiPage) {
    currentCalendar = new MultiPageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont,
      format,
      savedImages
    );
  } else {
    currentCalendar = new SinglePageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont,
      format,
      savedImages
    );
  }
}

/**
 * @property {Function} newProjectIDB - Set new project in IDB
 * @param {Object} newCalendarData - object with data for calendar
 * @param {number} [newCalendarData.startYear]
 * @param {number} [newCalendarData.firstMonthIndex]
 * @param {string} [newCalendarData.lang]
 * @param {string} [newCalendarData.mode] - single-page/multi-page
 */
function newProjectIDB({
  startYear,
  firstMonthIndex,
  lang,
  font,
  format,
  type,
}: CalendarData): void {
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
      type,
      font,
      format,
    });

    // Remove old images
    imagesStore.clear();

    transaction.oncomplete = function () {
      db.close();
    };
  };
}

/**
 * @property {Function} loadSavedProject - if some data in IndexedDB - retrieve project. If not - set up IDB schema for project
 */
function loadSavedProject(): void {
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
    const dataQuery = dataStore.get(0);
    const imagesQuery = imagesStore.getAll();

    let projectData: CalendarData;
    let imagesData: ImageObject[];

    dataQuery.onsuccess = function () {
      // If data...
      if (dataQuery.result) {
        projectData = dataQuery.result;
      }
    };

    // If images...
    imagesQuery.onsuccess = function () {
      imagesData = imagesQuery.result;
    };

    transaction.oncomplete = async function () {
      if (projectData) {
        await newCalendar(projectData, imagesData);
      }
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
    dataStore.createIndex("type", ["type"], { unique: false });
    dataStore.createIndex("font", ["font"], { unique: false });
    dataStore.createIndex("format", ["format"], { unique: false });

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

// Init
window.addEventListener(
  "DOMContentLoaded",
  async () => {
    // Load fonts data
    loadedFonts = await loadFonts();

    // Fill inputs with dynamic options
    yearInput.innerHTML = createYearsOptions(10);
    fontInput.innerHTML = createFontsOptions();
    monthInput.innerHTML = createMonthsOptions();
    formatInput.innerHTML = createFormatsOptions();

    // Show/Hide "New calendar container"
    newProjectBtn.addEventListener("click", () => {
      newProjectContainer.style.top = "-100px";
    });

    document.addEventListener("click", (e) => {
      if (
        !newCalendarInputsContainer.contains(e.target as Document) &&
        e.target !== newProjectBtn
      ) {
        newProjectContainer.style.top = "0px";
      }
    });

    // Generate new calendar from inputs
    getButton.addEventListener("click", newProject);

    // Init IndexedDB
    loadSavedProject();
  },
  { once: true }
);
