/**
 * @property {Function} getMonthFirstDay - gives position of first day on month
 * @param {number} month
 * @param {number} year
 */
export default function getMonthFirstDay(month: number, year: number): number {
  const index = new Date(year, month, 1);
  if (index.getDay() === 0) {
    return 7;
  }
  return index.getDay();
}
