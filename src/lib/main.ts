import '../styles/main.scss';

import { Calendar } from './Calendar';
import {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  getButton,
  multiModeBtn,
  newProjectOverlayTriggerBtn,
  newProjectOverlaySection,
  newProjectOverlayBG,
  newProjectOverlayCloseBtn,
} from './DOMElements';
import DataController from './entities/DataController/DataController';
import animateTriggerBtn from './animations/animateTriggerBtn';
import animateNewProjectOverlay from './animations/animateNewProjectOverlay';
import createDropdowns from './utils/DOM/createDropdowns';
import { CalendarType } from '../types';

let activeCalendar: Calendar | null = null;
let dataController: DataController | null;

let userInputs: ReturnType<typeof createDropdowns>;

async function newProject() {
  const newCalendarData: CalendarData = {
    startYear: userInputs.yearsInput.value,
    firstMonthIndex: userInputs.monthsInput.value,
    lang: userInputs.langsInput.value,
    font: userInputs.fontsInput.value,
    format: userInputs.formatsInput.value,
    type: multiModeBtn.checked ? CalendarType.MultiPage : CalendarType.SinglePage,
  };

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
    userInputs = createDropdowns();

    // Generate new calendar from inputs
    getButton.addEventListener('click', () => {
      animateNewProjectOverlay(newProjectOverlayBG, newProjectOverlaySection, 'out');
      newProject();
    });

    // Animate new project overlay trigger button on hover
    newProjectOverlayTriggerBtn?.addEventListener('mouseenter', animateTriggerBtn);
    newProjectOverlayTriggerBtn?.addEventListener('mouseleave', animateTriggerBtn);

    // Animate & toggle new project container
    newProjectOverlayTriggerBtn?.addEventListener('click', () => {
      animateNewProjectOverlay(newProjectOverlayBG, newProjectOverlaySection, 'in');
    });
    newProjectOverlayCloseBtn.addEventListener('click', () => {
      animateNewProjectOverlay(newProjectOverlayBG, newProjectOverlaySection, 'out');
    });

    // Init dataController
    dataController = new DataController();

    // Load fonts from /assets
    await dataController.loadFonts();

    try {
      // If some data in IDB - get it and store in DS object
      await dataController.retrieveDataFromIDB();

      // If data in DS - init new project
      if (dataController.calendarProjectData) {
        newCalendar();
      }
    } catch (err) {
      console.log('Failed to restore saved project:', err);
    }
  },
  { once: true },
);
