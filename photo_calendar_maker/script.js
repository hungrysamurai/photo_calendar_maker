import SinglePageCalendar from "./SinglePageCalendar.js";
import MultiPageCalendar from "./MultiPageCalendar.js";

const newProjectBtn = document.querySelector('#new-project');
const newProjectContainer = document.querySelector('.new-project-container');

const getButton = document.querySelector("#get-button");

const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");
const multiModeBtn = document.querySelector('#multi-page');
const langInput = document.querySelector('#lang-input');

const calendarContainer = document.querySelector(".calendar-container");
const controlsContainer = document.querySelector(".controls-container");
const cropControlsContainer = document.querySelector(
  ".crop-controls-container"
);

newProjectBtn.addEventListener('click', () => {
  newProjectContainer.style.top = '-60px';
});

let currentCalendar;

getButton.addEventListener("click", () => {
  const year = +yearInput.value;
  const month = +monthInput.value;
  const lang = langInput.value;

  console.log(lang);
  calendarContainer.innerHTML = "";
  if (document.querySelector(".cropper-outer-container")) {
    document.querySelector(".cropper-outer-container").remove();
  }

  if (multiModeBtn.checked) {

    currentCalendar = new MultiPageCalendar(
      month,
      year,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      'multi-page'
    );

  } else {

    currentCalendar = new SinglePageCalendar(
      month,
      year,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      lang,
      'single-page'
    );
  }

  newProjectContainer.style.top = '0px';
});
