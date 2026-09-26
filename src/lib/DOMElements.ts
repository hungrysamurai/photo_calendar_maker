const newProjectOverlayTriggerBtn = document.querySelector(
  '.new-project-overlay-trigger-btn',
) as HTMLButtonElement;
const newProjectOverlaySection = document.querySelector('.new-project-section') as HTMLElement;
const newProjectOverlayBG = document.querySelector('.new-project-bg') as HTMLElement;
const newProjectOverlayCloseBtn = document.querySelector(
  '.new-project-section__close-modal',
) as HTMLDivElement;

const singleModeBtn = document.querySelector('#single-page') as HTMLInputElement;
const multiModeBtn = document.querySelector('#multi-page') as HTMLInputElement;

const getButton = document.querySelector('#get-button') as HTMLButtonElement;
const editButton = document.querySelector('#edit-button') as HTMLButtonElement;
const deleteButton = document.querySelector('#delete-button') as HTMLButtonElement;
const cancelButton = document.querySelector('#cancel-button') as HTMLButtonElement;

const projectNameInput = document.querySelector('#project-name-input') as HTMLInputElement;

const projectsDropdownContainer = document.querySelector('#projects-dropdown') as HTMLDivElement;
const projectSettingsBlock = document.querySelector(
  '.new-project-section__settings',
) as HTMLDivElement;
const lockedSettingsHint = document.querySelector(
  '.new-project-section__locked-hint',
) as HTMLParagraphElement;

const yearDropdownContainer = document.querySelector('#year-dropdown') as HTMLDivElement;
const monthDropdownContainer = document.querySelector('#month-dropdown') as HTMLDivElement;
const langDropdownContainer = document.querySelector('#lang-dropdown') as HTMLDivElement;
const fontDropdownContainer = document.querySelector('#font-dropdown') as HTMLDivElement;
const formatDropdownContainer = document.querySelector('#format-dropdown') as HTMLDivElement;

const calendarContainer = document.querySelector('.calendar-container') as HTMLDivElement;
const controlsContainer = document.querySelector('.controls-container') as HTMLDivElement;
const cropControlsContainer = document.querySelector('.crop-controls-container') as HTMLDivElement;

export {
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
  yearDropdownContainer,
  monthDropdownContainer,
  langDropdownContainer,
  fontDropdownContainer,
  formatDropdownContainer,
};
