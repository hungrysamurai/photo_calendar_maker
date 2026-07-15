const newProjectOverlayTriggerBtn = document.querySelector(
  '.new-project-overlay-trigger-btn',
) as HTMLButtonElement;
const newProjectOverlaySection = document.querySelector('.new-project-section') as HTMLElement;
const newProjectOverlayBG = document.querySelector('.new-project-bg') as HTMLElement;
const newProjectOverlayCloseBtn = document.querySelector(
  '.new-project-section__close-modal',
) as HTMLDivElement;

const getButton = document.querySelector('#get-button') as HTMLButtonElement;

const monthInput = document.querySelector('#month-input') as HTMLSelectElement;
const yearInput = document.querySelector('#year-input') as HTMLSelectElement;
const multiModeBtn = document.querySelector('#multi-page') as HTMLInputElement;
const langInput = document.querySelector('#lang-input') as HTMLSelectElement;
const fontInput = document.querySelector('#font-input') as HTMLSelectElement;
const formatInput = document.querySelector('#format-input') as HTMLSelectElement;

const calendarContainer = document.querySelector('.calendar-container') as HTMLDivElement;
const controlsContainer = document.querySelector('.controls-container') as HTMLDivElement;
const cropControlsContainer = document.querySelector('.crop-controls-container') as HTMLDivElement;

export {
  calendarContainer,
  controlsContainer,
  cropControlsContainer,
  fontInput,
  formatInput,
  getButton,
  langInput,
  monthInput,
  multiModeBtn,
  newProjectOverlayTriggerBtn,
  newProjectOverlaySection,
  newProjectOverlayBG,
  newProjectOverlayCloseBtn,
  yearInput,
};
