import '../styles/main.scss';

import { Calendar } from './Calendar';
import {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  getButton,
  projectNameInput,
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

// Set once the user edits the name field; stops auto-suggestions from overwriting it
let isProjectNameDirty = false;

function getSuggestedProjectName() {
  return getProjectName(userInputs.yearsInput.value, userInputs.formatsInput.value);
}

// Refresh the suggested name unless the user has typed their own
function syncSuggestedProjectName() {
  if (!isProjectNameDirty) {
    projectNameInput.value = getSuggestedProjectName();
  }
}

async function newProject() {
  const now = Date.now();
  const startYear = userInputs.yearsInput.value;
  const format = userInputs.formatsInput.value;

  // Empty / whitespace-only name falls back to the generated default
  const name = projectNameInput.value.trim() || getProjectName(startYear, format);

  const newCalendarData: CalendarData = {
    name,
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

  // Reset name field to a fresh suggestion for the next project
  isProjectNameDirty = false;
  syncSuggestedProjectName();
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
    userInputs = createDropdowns(syncSuggestedProjectName);
    syncSuggestedProjectName();

    projectNameInput.addEventListener('input', () => {
      isProjectNameDirty = true;
    });

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
