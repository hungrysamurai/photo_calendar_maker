import { MultiPageCalendar } from './MultiPageCalendar';
import { SinglePageCalendar } from './SinglePageCalendar';

import { collectDataFromInputs } from './utils/DOM/collectDataFromInputs';

import { createFontsOptions } from './utils/DOM/initializers/createFontsOptions';
import { createFormatsOptions } from './utils/DOM/initializers/createFormatsOptions';
import { createMonthsOptions } from './utils/DOM/initializers/createMonthsOptions';
import { createYearsOptions } from './utils/DOM/initializers/createYearsOptions';

import { loadFonts } from './utils/DOM/initializers/loadFonts';

import { CalendarType } from '../types';
import initIDB from './utils/IDB/initIDB';
import resetProjectIDB from './utils/IDB/resetProjectIDB';

import { Calendar } from './Calendar';
import {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  fontInput,
  formatInput,
  getButton,
  langInput,
  monthInput,
  multiModeBtn,
  newCalendarInputsContainer,
  newProjectBtn,
  newProjectContainer,
  yearInput,
} from './DOMElements';

let loadedFonts: LoadedFontsObject;
let activeCalendar: Calendar | null = null;

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
    multiModeBtn,
  );

  // Purge all current content
  calendarContainer.innerHTML = '';

  // Generate new calendar
  newCalendar(newCalendarData);

  // Set new calendar in IDB
  resetProjectIDB(newCalendarData);

  // Hide new calendar inputs
  newProjectContainer.style.top = '0px';
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
const newCalendar: InitProjectFn = async function (
  { startYear, firstMonthIndex, lang, font, format, type },
  savedImages,
) {
  if (activeCalendar) {
    activeCalendar.dispose();
  }

  const currentFont: FontArray = loadedFonts[font];

  if (type === CalendarType.MultiPage) {
    activeCalendar = new MultiPageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont,
      format,
      savedImages,
    );
  } else {
    activeCalendar = new SinglePageCalendar(
      firstMonthIndex,
      startYear,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      type,
      currentFont,
      format,
      savedImages,
    );
  }
};

// Init
window.addEventListener(
  'DOMContentLoaded',
  async () => {
    // Load fonts data
    loadedFonts = await loadFonts();

    // Fill inputs with dynamic options
    yearInput.innerHTML = createYearsOptions(10);
    fontInput.innerHTML = createFontsOptions();
    monthInput.innerHTML = createMonthsOptions();
    formatInput.innerHTML = createFormatsOptions();

    // Show/Hide "New calendar container"
    newProjectBtn.addEventListener('click', () => {
      newProjectContainer.style.top = '-100px';
    });

    document.addEventListener('click', (e) => {
      if (
        !newCalendarInputsContainer.contains(e.target as Document) &&
        e.target !== newProjectBtn
      ) {
        newProjectContainer.style.top = '0px';
      }
    });

    // Generate new calendar from inputs
    getButton.addEventListener('click', newProject);

    // Init IndexedDB
    initIDB(newCalendar);
  },
  { once: true },
);
