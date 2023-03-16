import SinglePageCalendar from "./SinglePageCalendar.js";
import MultiPageCalendar from "./MultiPageCalendar.js";

const getButton = document.querySelector("#get-button");
const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");
const multiModeBtn = document.querySelector('#multi-page');

const calendarContainer = document.querySelector(".calendar-container");
const controlsContainer = document.querySelector(".controls-container");
const cropControlsContainer = document.querySelector(
  ".crop-controls-container"
);

let currentCalendar;

getButton.addEventListener("click", () => {
  const year = +yearInput.value;
  const month = +monthInput.value;

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
      "ru",
      'multi-page'
    );

  } else {

    currentCalendar = new SinglePageCalendar(
      month,
      year,
      calendarContainer,
      controlsContainer,
      cropControlsContainer,
      "ru",
      'single-page'
    );
  }
});
