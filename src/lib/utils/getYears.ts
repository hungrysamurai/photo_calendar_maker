export default function getYears(numberOfYearsToAdd: number): number[] {
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  for (let i = 1; i < numberOfYearsToAdd; i++) {
    years.push(new Date().getFullYear() + i);
  }

  return years;
}

/**
 * `years` plus `year` when it is missing, sorted ascending
 */
export function withYear(years: number[], year: number): number[] {
  if (years.includes(year)) return years;

  return [...years, year].sort((a, b) => a - b);
}
