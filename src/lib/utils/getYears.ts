export default function getYears(numberOfYearsToAdd: number): number[] {
  const currentYear = new Date().getFullYear();
  const years = [currentYear];

  for (let i = 1; i < numberOfYearsToAdd; i++) {
    years.push(new Date().getFullYear() + i);
  }

  return years;
}
