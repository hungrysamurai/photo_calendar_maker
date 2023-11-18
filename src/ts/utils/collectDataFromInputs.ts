import { CalendarLanguage, CalendarType, FormatName } from '../../../types.d'

export const collectDataFromInputs = (
 yearInput: HTMLSelectElement,
 monthInput: HTMLSelectElement,
 langInput: HTMLSelectElement,
 fontInput: HTMLSelectElement,
 formatInput: HTMLSelectElement,
 multiModeBtn: HTMLInputElement
): CalendarData => {
 // Collect data from inputs

 const startYear: number = Number(yearInput.value);

 const firstMonthIndex: number = Number(monthInput.value);

 const lang: CalendarLanguage = langInput.value as CalendarLanguage;

 const font: string = fontInput.value;

 const format: FormatName = formatInput.value as FormatName;

 const type: CalendarType = multiModeBtn.checked ? CalendarType.MultiPage : CalendarType.SinglePage;

 return {
  startYear,
  firstMonthIndex,
  lang,
  font,
  format,
  type,
 };
}