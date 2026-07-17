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
import { FormatName } from '../../../types';

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

  const monthsInput = new Dropdown<string>({
    container: monthDropdownContainer,
    items: monthsList,
    value: monthsList[currentMonth],
    caption: 'Первый месяц',
    renderItem: (item) => item,
  });

  // Create langs dropdown
  const langsInput = new Dropdown<string>({
    container: langDropdownContainer,
    items: ['ru', 'en'],
    value: 'ru',
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

  // Create fotmats dropdown
  const formatsInput = new Dropdown<string>({
    container: formatDropdownContainer,
    items: Object.keys(A_outputFormats),
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
