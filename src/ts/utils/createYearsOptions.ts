/**
 * @property {Function} createYearsOptions - Generate years elements for select input (current year + 5)
 */
export const createYearsOptions = (numberOfYearsToAdd: number): string => {
 const currentYear = new Date().getFullYear();
 const years = [currentYear];

 for (let i = 1; i < numberOfYearsToAdd; i++) {
  years.push(new Date().getFullYear() + i);
 }

 return years.map((year) => {
  return `<option value=${year}>${year}</option>`;
 })
  .join("");
}
