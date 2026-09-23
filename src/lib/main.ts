import '../styles/main.scss';

import { Calendar } from './Calendar';
import {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  getButton,
  editButton,
  deleteButton,
  cancelButton,
  projectNameInput,
  projectsDropdownContainer,
  projectSettingsBlock,
  lockedSettingsHint,
  singleModeBtn,
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

// Saved project whose settings are being edited; null outside edit mode
let editingProject: StoredProject | null = null;

/**
 * State of the "Новый" form, kept aside while the form is borrowed for editing
 */
type NewProjectDraft = {
  startYear: number;
  firstMonthIndex: number;
  lang: CalendarData['lang'];
  font: string;
  format: CalendarData['format'];
  isMultiPage: boolean;
  name: string;
  isNameDirty: boolean;
};

let newProjectDraft: NewProjectDraft | null = null;

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

/**
 * "Новый" shows the settings form + "Создать";
 * a saved project hides the form + "Открыть"/"Изменить"/"Удалить";
 * editing shows the pre-filled form + "Сохранить"/"Отмена"
 */
function onProjectPickerChange(item: ProjectPickerItem) {
  const isEditing = editingProject !== null;
  const isNew = !isEditing && item.kind === 'new';
  const isSelected = !isEditing && item.kind === 'project';

  projectSettingsBlock.classList.toggle('hide', isSelected);
  getButton.textContent = isEditing ? 'Сохранить' : isNew ? 'Создать' : 'Открыть';
  editButton.classList.toggle('hide', !isSelected);
  deleteButton.classList.toggle('hide', !isSelected);
  cancelButton.classList.toggle('hide', !isEditing);
}

function takeNewProjectDraft(): NewProjectDraft {
  return {
    startYear: userInputs.yearsInput.value,
    firstMonthIndex: userInputs.monthsInput.value,
    lang: userInputs.langsInput.value,
    font: userInputs.fontsInput.value,
    format: userInputs.formatsInput.value,
    isMultiPage: multiModeBtn.checked,
    name: projectNameInput.value,
    isNameDirty: isProjectNameDirty,
  };
}

// Fill the settings form without triggering name auto-suggestions
function fillSettingsForm(values: NewProjectDraft) {
  userInputs.yearsInput.setValue(values.startYear);
  userInputs.monthsInput.setValue(values.firstMonthIndex);
  userInputs.langsInput.setValue(values.lang);
  userInputs.fontsInput.setValue(values.font);
  userInputs.formatsInput.setValue(values.format);

  multiModeBtn.checked = values.isMultiPage;
  singleModeBtn.checked = !values.isMultiPage;

  projectNameInput.value = values.name;
  isProjectNameDirty = values.isNameDirty;
}

// Format and type are fixed after creation; the picker is locked while editing
function setEditLocks(locked: boolean) {
  userInputs.formatsInput.setDisabled(locked);
  singleModeBtn.disabled = locked;
  multiModeBtn.disabled = locked;
  lockedSettingsHint.classList.toggle('hide', !locked);

  // Photos are not re-indexed yet, so a new first month would put them on the wrong pages
  userInputs.monthsInput.setDisabled(locked);

  projectsInput.setDisabled(locked);
}

/**
 * Put the "Новый" draft aside and show the selected project's settings in the form
 */
function enterEditMode() {
  const selected = projectsInput.value;

  if (selected.kind !== 'project' || editingProject) return;

  const { project } = selected;

  newProjectDraft = takeNewProjectDraft();
  editingProject = project;

  fillSettingsForm({
    startYear: project.startYear,
    firstMonthIndex: project.firstMonthIndex,
    lang: project.lang,
    font: project.font,
    format: project.format,
    isMultiPage: project.type === CalendarType.MultiPage,
    name: project.name,
    // Keep the project's name as-is while its year changes
    isNameDirty: true,
  });

  setEditLocks(true);
  onProjectPickerChange(selected);
}

/**
 * Discard edits, restore the "Новый" draft and return to the selected project
 */
function exitEditMode() {
  if (!editingProject) return;

  editingProject = null;

  if (newProjectDraft) {
    fillSettingsForm(newProjectDraft);
    newProjectDraft = null;
  }

  setEditLocks(false);
  onProjectPickerChange(projectsInput.value);
}

/**
 * Persist the edited settings and open the project. Unchanged settings only
 * open it (nothing is written); a failure keeps edit mode and the current calendar.
 */
async function saveEditedProject() {
  if (!editingProject) return;

  const { id } = editingProject;

  const settings: EditableProjectSettings = {
    // Empty / whitespace-only name falls back to the generated default
    name: projectNameInput.value.trim() || getSuggestedProjectName(),
    startYear: userInputs.yearsInput.value,
    firstMonthIndex: userInputs.monthsInput.value,
    lang: userInputs.langsInput.value,
    font: userInputs.fontsInput.value,
  };

  let isChanged: boolean;

  try {
    isChanged = (await dataController?.updateProject(id, settings)) ?? false;
  } catch (err) {
    console.log(`Failed to save project ${id}:`, err);
    return;
  }

  exitEditMode();
  closeOverlay();

  if (isChanged) {
    // Re-render with the new settings
    newCalendar();
    await refreshProjectsList();
  } else {
    await openProject(id);
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
  if (editingProject) {
    await saveEditedProject();
    return;
  }

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
    editButton.addEventListener('click', enterEditMode);
    deleteButton.addEventListener('click', onDeleteButtonClick);
    cancelButton.addEventListener('click', exitEditMode);

    // Animate new project overlay trigger button on hover
    newProjectOverlayTriggerBtn?.addEventListener('mouseenter', animateTriggerBtn);
    newProjectOverlayTriggerBtn?.addEventListener('mouseleave', animateTriggerBtn);

    // Animate & toggle new project container; picker always reopens on "Новый"
    newProjectOverlayTriggerBtn?.addEventListener('click', async () => {
      await refreshProjectsList();
      openOverlay();
    });
    // Closing the overlay while editing discards the edit
    newProjectOverlayCloseBtn.addEventListener('click', () => {
      exitEditMode();
      closeOverlay();
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
      disposeCalendar();
    }

    await refreshProjectsList();
  },
  { once: true },
);
