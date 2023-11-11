import { CalendarLanguage, CalendarType } from '../../../types.d'

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
 const lang: CalendarLanguage = langInput.value as CalendarLanguage;
 /**
  * @type {string}
  */
 const font: string = fontInput.value;
 /**
  * @type {string}
  */
 const type: CalendarType = multiModeBtn.checked ? CalendarType.MultiPage : CalendarType.SinglePage;

 return {
  startYear,
  firstMonthIndex,
  lang,
  font,
  type,
 };
}