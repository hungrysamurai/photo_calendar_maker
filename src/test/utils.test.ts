import { describe, expect, it } from 'vitest';

import getDaysInMonth from '../lib/utils/getDaysInMonth';
import getMonthFirstDay from '../lib/utils/getMonthFirstDay';
import { getMonthsList } from '../lib/utils/getMonthsList';
import getWeekDays from '../lib/utils/getWeekDays';
import { createSVGElement } from '../lib/utils/DOM/createElement/createSVGElement';
import { CalendarLanguage } from '../types';

describe('calendar utility helpers', () => {
  it('returns 29 days for February in a leap year', () => {
    expect(getDaysInMonth(2, 2024)).toBe(29);
  });

  it('treats Sunday as 7 in the week index', () => {
    expect(getMonthFirstDay(0, 2023)).toBe(7);
  });

  it('returns the russian month names with 12 items', () => {
    const months = getMonthsList('ru');

    expect(months).toHaveLength(12);
    expect(months[0]).toBe('Январь');
    expect(months[11]).toBe('Декабрь');
  });

  it('returns the weekday names in the requested language', () => {
    const weekDays = getWeekDays('short', CalendarLanguage.RU);

    expect(weekDays).toHaveLength(7);
    expect(weekDays[0]).toBe('Пн');
    expect(weekDays[6]).toBe('Вс');
  });

  it('creates an SVG element and appends it to the provided parent', () => {
    const parent = document.createElement('div');

    const svgElement = createSVGElement({
      elementName: 'g',
      id: 'image-group',
      parentToAppend: parent,
      attributes: {
        'data-test': 'ok',
      },
    });

    expect(svgElement.tagName).toBe('g');
    expect(svgElement.id).toBe('image-group');
    expect(svgElement.getAttribute('data-test')).toBe('ok');
    expect(parent.querySelector('g')).toBe(svgElement);
  });
});
