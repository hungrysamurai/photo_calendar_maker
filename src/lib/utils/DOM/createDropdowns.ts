import {
  yearDropdownContainer,
  monthDropdownContainer,
  langDropdownContainer,
  fontDropdownContainer,
  formatDropdownContainer,
} from '../../DOMElements';

import { Dropdown } from './Dropdown';

import getYears from '../getYears';
import getFormatLabel from '../getFormatLabel';
import { getMonthsList } from '../getMonthsList';
import fontsData from '../../../assets/sourceFontsData';
import { A_outputFormats } from '../../../assets/A_FormatOptions/A_OutputDimensions';
import { CalendarLanguage, FormatName } from '../../../types';

/**
 * @param onChange - called whenever a dropdown that affects the generated project name changes
 */
export default function createDropdowns(onChange?: () => void) {
  // Create years dropdown
  const yearsInput = new Dropdown<number>({
    container: yearDropdownContainer,
    items: getYears(10),
    caption: 'Начальный год',
    renderItem: (item) => item.toString(),
    onChange,
  });

  // Create months dropdown

  // Get current month...
  const currentMonth = new Date().getMonth();
  const monthsList = getMonthsList();

  const monthsInput = new Dropdown<number>({
    container: monthDropdownContainer,
    items: Array.from({ length: monthsList.length }, (_, i) => i),
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
    renderItem: getFormatLabel,
    onChange,
  });

  return { yearsInput, monthsInput, langsInput, fontsInput, formatsInput };
}
