import {
  yearDropdownContainer,
  monthDropdownContainer,
  langDropdownContainer,
  fontDropdownContainer,
  formatDropdownContainer,
} from '../../DOMElements';

import { Dropdown } from './Dropdown';

import getYears from '../getYears';
import { getMonthsList } from '../getMonthsList';
import fontsData from '../../../assets/sourceFontsData';
import { A_outputFormats } from '../../../assets/A_FormatOptions/A_OutputDimensions';
import { CalendarLanguage, FormatName } from '../../../types';

export default function createDropdowns() {
  // Create years dropdown
  const yearsInput = new Dropdown<number>({
    container: yearDropdownContainer,
    items: getYears(10),
    caption: 'Начальный год',
    renderItem: (item) => item.toString(),
  });

  // Create months dropdown

  // Get current month...
  const currentMonth = new Date().getMonth();
  const monthsList = getMonthsList();

  const monthsInput = new Dropdown<number>({
    container: monthDropdownContainer,
    items: Array.from({ length: monthsList.length + 1 }, (_, i) => i),
    value: currentMonth,
    caption: 'Первый месяц',
    renderItem: (item) => monthsList[item],
  });

  // Create langs dropdown
  const langsInput = new Dropdown<CalendarLanguage>({
    container: langDropdownContainer,
    items: [CalendarLanguage.RU, CalendarLanguage.EN],
    value: CalendarLanguage.RU,
    caption: 'Язык календаря',
    renderItem: (item) => {
      if (item === 'ru') {
        return 'Русский';
      } else {
        return 'English';
      }
    },
  });

  // Create fonts dropdown
  const fontsInput = new Dropdown<string>({
    container: fontDropdownContainer,
    items: Object.keys(fontsData),
    caption: 'Шрифт',
    renderItem: (font) => `
        <span style="font-family:${font}">
            ${font}
        </span>
    `,
  });

  // Create formats dropdown
  const formatsInput = new Dropdown<FormatName>({
    container: formatDropdownContainer,
    items: Object.keys(A_outputFormats) as FormatName[],
    value: FormatName.A4_Y,
    caption: 'Формат',
    renderItem: (format) => {
      const formatPrefix = format.slice(0, 2);
      if (format.endsWith('Y')) {
        return `${formatPrefix} вертикальный`;
      } else {
        return `${formatPrefix} горизонтальный`;
      }
    },
  });

  return { yearsInput, monthsInput, langsInput, fontsInput, formatsInput };
}
