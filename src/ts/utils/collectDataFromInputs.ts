import { CalendarData } from "../types/types"

export const collectDataFromInputs = (
 yearInput: HTMLSelectElement,
 monthInput: HTMLSelectElement,
 langInput: HTMLSelectElement,
 fontInput: HTMLSelectElement,
 multiModeBtn: HTMLInputElement
): CalendarData => {
 // Collect data from inputs
 /**
  * @type {number}
  */
 const startYear: number = Number(yearInput.value);
 /**
  * @type {number}
  */
 const firstMonthIndex: number = Number(monthInput.value);
 /**
  * @type {string}
  */
 const lang: string = langInput.value;
 /**
  * @type {string}
  */
 const font: string = fontInput.value;
 /**
  * @type {string}
  */
 const mode: string = multiModeBtn.checked ? "multi-page" : "single-page";

 return {
  startYear,
  firstMonthIndex,
  lang,
  font,
  mode,
 };
}