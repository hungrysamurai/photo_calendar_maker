const newProjectContainer = document.querySelector('.new-project-container') as HTMLDivElement;
const newProjectBtn = document.querySelector('#new-project') as HTMLButtonElement;

const newCalendarInputsContainer = document.querySelector(
  '.new-calendar-controls',
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
  newCalendarInputsContainer,
  newProjectBtn,
  newProjectContainer,
  yearInput,
};
