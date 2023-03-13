// MultiPage glyphs set
import monthsMP from "./MP/months.js";
import yearsMP from "./MP/years.js";
import digitsMP from "./MP/digits.js";
import secondaryDigitsMP from "./MP/secondaryDigits.js";
import weekDaysMP from "./MP/weekDays.js";

import monthsCyrMP from "./MP/months_cyr.js";
import weekDaysCyrMP from "./MP/weekDays_cyr.js";

// SinglePage glyphs set
import digitsSP from "./SP/digits.js";
import secondaryDigitsSP from "./SP/secondaryDigits.js";
import monthsSP from "./SP/months.js";
import weekDaysSP from "./SP/weekDays.js";
import yearsSP from "./SP/years.js";

const glyphsMP = {
  months: monthsCyrMP,
  // months: monthsMP,
  years: yearsMP,
  digits: digitsMP,
  secondaryDigits: secondaryDigitsMP,
  weekDays: weekDaysCyrMP,
  // weekDays:weekDaysMP
};

const glyphsSP = {
  digits: digitsSP,
  secondaryDigits: secondaryDigitsSP,
  months: monthsSP,
  weekDays: weekDaysSP,
  years: yearsSP,
};

export { glyphsMP, glyphsSP };
