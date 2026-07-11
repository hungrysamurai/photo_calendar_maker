import '../styles/main.scss';

import { collectDataFromInputs } from './utils/DOM/collectDataFromInputs';

import { createFontsOptions } from './utils/DOM/initializers/createFontsOptions';
import { createFormatsOptions } from './utils/DOM/initializers/createFormatsOptions';
import { createMonthsOptions } from './utils/DOM/initializers/createMonthsOptions';
import { createYearsOptions } from './utils/DOM/initializers/createYearsOptions';

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
  yearInput,
} from './DOMElements';
import DataController from './entities/DataController/DataController';

let activeCalendar: Calendar | null = null;
let dataController: DataController | null;

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

  // Set new calendar in IDB via DS with user's input data
  await dataController?.reset(newCalendarData);

  // Generate new calendar
  newCalendar();
}

function newCalendar() {
  controlsContainer.classList.remove('hide');
  if (activeCalendar) {
    activeCalendar.dispose();
  }

  activeCalendar = new Calendar(
    {
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
    },
    dataController as DataController,
  );
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

    // // Show/Hide "New calendar container"
    // newProjectBtn.addEventListener('click', () => {
    //   newProjectContainer.style.top = '-100px';
    // });

    // document.addEventListener('click', (e) => {
    //   if (
    //     !newCalendarInputsContainer.contains(e.target as Document) &&
    //     e.target !== newProjectBtn
    //   ) {
    //     newProjectContainer.style.top = '0px';
    //   }
    // });

    // Generate new calendar from inputs
    getButton.addEventListener('click', newProject);

    // Init dataController
    dataController = new DataController();

    // Load fonts from /assets
    await dataController.loadFonts();

    // If some data in IDB - get it and store in DS object
    await dataController.retrieveDataFromIDB();

    // If data in DS - init new project
    if (dataController.calendarProjectData) {
      newCalendar();
    }
  },
  { once: true },
);
