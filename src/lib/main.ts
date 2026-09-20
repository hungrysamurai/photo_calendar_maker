import '../styles/main.scss';

import { Calendar } from './Calendar';
import {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  getButton,
  deleteButton,
  projectNameInput,
  projectsDropdownContainer,
  projectSettingsBlock,
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
import createProjectsDropdown, {
  NEW_PROJECT_ITEM,
  ProjectPickerItem,
  toProjectPickerItems,
} from './utils/DOM/createProjectsDropdown';
import getProjectName from './utils/getProjectName';
import { CalendarType } from '../types';

let activeCalendar: Calendar | null = null;
let dataController: DataController | null;

let userInputs: ReturnType<typeof createDropdowns>;
let projectsInput: ReturnType<typeof createProjectsDropdown>;

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

function openOverlay() {
  animateNewProjectOverlay(newProjectOverlayBG, newProjectOverlaySection, 'in');
}

function closeOverlay() {
  animateNewProjectOverlay(newProjectOverlayBG, newProjectOverlaySection, 'out');
}

/**
 * Re-read saved projects into the picker and select "Новый";
 * the picker is hidden while there are no projects
 */
async function refreshProjectsList() {
  const projects = (await dataController?.listProjects()) ?? [];

  projectsInput.setItems(toProjectPickerItems(projects), NEW_PROJECT_ITEM);
  projectsDropdownContainer.classList.toggle('hide', projects.length === 0);

  onProjectPickerChange(NEW_PROJECT_ITEM);
}

// "Новый" shows the settings form + "Создать"; a saved project hides the form + "Открыть"/"Удалить"
function onProjectPickerChange(item: ProjectPickerItem) {
  const isNew = item.kind === 'new';

  projectSettingsBlock.classList.toggle('hide', !isNew);
  getButton.textContent = isNew ? 'Создать' : 'Открыть';
  deleteButton.classList.toggle('hide', isNew);
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

  // Persist a new project (earlier projects stay in IDB) and make it active
  await dataController?.createProject(newCalendarData);
  // Generate new calendar
  newCalendar();

  // Reset name field to a fresh suggestion for the next project
  isProjectNameDirty = false;
  syncSuggestedProjectName();

  await refreshProjectsList();
}

async function openProject(id: number) {
  // Already looking at this project — nothing to re-render
  if (dataController?.activeProjectId === id) return;

  try {
    await dataController?.loadProject(id);
    newCalendar();
  } catch (err) {
    console.log(`Failed to open project ${id}:`, err);
    disposeCalendar();
  }

  // Keep "most recently opened first" ordering up to date
  await refreshProjectsList();
}

// Primary overlay button: create or open, depending on the picker
async function onGetButtonClick() {
  const selected = projectsInput.value;

  closeOverlay();

  if (selected.kind === 'new') {
    await newProject();
  } else {
    await openProject(selected.project.id);
  }
}

/**
 * Delete the selected project with all of its images after confirmation;
 * the overlay stays open with the picker reset to "Новый"
 */
async function onDeleteButtonClick() {
  const selected = projectsInput.value;

  if (selected.kind !== 'project') return;

  const { id, name } = selected.project;

  if (!confirm(`Удалить проект «${name}»? Все его изображения будут удалены.`)) return;

  const wasActive = dataController?.activeProjectId === id;

  try {
    await dataController?.deleteProject(id);
  } catch (err) {
    console.log(`Failed to delete project ${id}:`, err);
    return;
  }

  // The calendar behind the overlay no longer exists
  if (wasActive) {
    disposeCalendar();
  }

  await refreshProjectsList();
}

function newCalendar() {
  disposeCalendar();
  controlsContainer.classList.remove('hide');

  activeCalendar = new Calendar(
    {
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
    },
    dataController as DataController,
  );
}

/**
 * Tear down the current calendar and leave the app in the "no project" state
 */
function disposeCalendar() {
  activeCalendar?.dispose();
  activeCalendar = null;

  calendarContainer.innerHTML = '';
  controlsContainer.classList.add('hide');
}

// Init
window.addEventListener(
  'DOMContentLoaded',
  async () => {
    userInputs = createDropdowns(syncSuggestedProjectName);
    syncSuggestedProjectName();

    projectsInput = createProjectsDropdown(onProjectPickerChange);

    projectNameInput.addEventListener('input', () => {
      isProjectNameDirty = true;
    });

    // Create or open a project from the picker
    getButton.addEventListener('click', onGetButtonClick);
    deleteButton.addEventListener('click', onDeleteButtonClick);

    // Animate new project overlay trigger button on hover
    newProjectOverlayTriggerBtn?.addEventListener('mouseenter', animateTriggerBtn);
    newProjectOverlayTriggerBtn?.addEventListener('mouseleave', animateTriggerBtn);

    // Animate & toggle new project container; picker always reopens on "Новый"
    newProjectOverlayTriggerBtn?.addEventListener('click', async () => {
      await refreshProjectsList();
      openOverlay();
    });
    newProjectOverlayCloseBtn.addEventListener('click', closeOverlay);

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
      disposeCalendar();
    }

    await refreshProjectsList();
  },
  { once: true },
);
