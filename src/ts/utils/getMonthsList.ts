export const getMonthsList = (lang: string = 'en') => {
 return Array.from({ length: 12 }, (_, i) => {
  let monthName = new Intl.DateTimeFormat(lang, { month: "long" }).format(new Date(0, i));

  if (lang !== 'en') {
   monthName = monthName[0].toUpperCase() + monthName.slice(1);
  }

  return monthName
 })
}
