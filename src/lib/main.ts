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
import getProjectName from './utils/getProjectName';
import { CalendarType } from '../types';

let activeCalendar: Calendar | null = null;
let dataController: DataController | null;

let userInputs: ReturnType<typeof createDropdowns>;

async function newProject() {
  const now = Date.now();
  const startYear = userInputs.yearsInput.value;
  const format = userInputs.formatsInput.value;

  const newCalendarData: CalendarData = {
    name: getProjectName(startYear, format),
    createdAt: now,
    lastOpenedAt: now,
    startYear,
    firstMonthIndex: userInputs.monthsInput.value,
    lang: userInputs.langsInput.value,
    font: userInputs.fontsInput.value,
    format,
    type: multiModeBtn.checked ? CalendarType.MultiPage : CalendarType.SinglePage,
  };

  // Purge all current content
  calendarContainer.innerHTML = '';
  // Persist a new project (earlier projects stay in IDB) and make it active
  await dataController?.createProject(newCalendarData);
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
      // Reopen the most recently opened project, if any
      const restored = await dataController.restoreLastOpened();

      if (restored) {
        newCalendar();
      }
    } catch (err) {
      console.log('Failed to restore saved project:', err);
    }
  },
  { once: true },
);
