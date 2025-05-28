/**
 * @property {Function} getDaysInMonth - gives number of days in current month
 * @param {number} month - given month
 * @param {number} year - given year
 * @returns {number} - total number of days in given month
 */
export default function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}
