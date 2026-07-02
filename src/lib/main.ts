import { collectDataFromInputs } from './utils/DOM/collectDataFromInputs';

import { createFontsOptions } from './utils/DOM/initializers/createFontsOptions';
import { createFormatsOptions } from './utils/DOM/initializers/createFormatsOptions';
import { createMonthsOptions } from './utils/DOM/initializers/createMonthsOptions';
import { createYearsOptions } from './utils/DOM/initializers/createYearsOptions';

import fontsData from '../assets/sourceFontsData';
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
import DataStore from './entities/DataStore/DataStore';

let activeCalendar: Calendar | null = null;
let dataStore: DataStore | null;

async function newProject() {
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

  // Set new calendar in IDB
  // resetProjectIDB(newCalendarData);
  await dataStore?.reset(newCalendarData);

  // Generate new calendar
  newCalendar();

  newProjectContainer.style.top = '0px';
}

function newCalendar() {
  if (activeCalendar) {
    activeCalendar.dispose();
  }

  activeCalendar = new Calendar(
    {
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
    },
    dataStore as DataStore,
  );

  // if (dataStore && dataStore.calendarProjectData) {
  //   if (dataStore.calendarProjectData.type === CalendarType.MultiPage) {
  //     activeCalendar = new MultiPageCalendar({
  //       DOMElements: { calendarContainer, controlsContainer, cropControlsContainer },
  //       dataStore,
  //     });
  //   } else {
  //     activeCalendar = new SinglePageCalendar({
  //       DOMElements: { calendarContainer, controlsContainer, cropControlsContainer },
  //       dataStore,
  //     });
  //   }
  // }
}

// Init
window.addEventListener(
  'DOMContentLoaded',
  async () => {
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

    // Init dataStore, load fonts from assets
    dataStore = new DataStore();

    await dataStore.fontsController.loadFonts(fontsData);
    await dataStore.retrieveDataFromIDB();

    if (dataStore.calendarProjectData) {
      newCalendar();
    }
  },
  { once: true },
);
