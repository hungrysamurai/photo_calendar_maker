import { describe, expect, it } from 'vitest';

import getDaysInMonth from '../lib/utils/getDaysInMonth';
import getMonthFirstDay from '../lib/utils/getMonthFirstDay';
import getProjectSummary from '../lib/utils/getProjectSummary';
import getProjectName, { isCustomProjectName } from '../lib/utils/getProjectName';
import { withYear } from '../lib/utils/getYears';
import { getMonthsList } from '../lib/utils/getMonthsList';
import getWeekDays from '../lib/utils/getWeekDays';
import { createSVGElement } from '../lib/utils/DOM/createElement/createSVGElement';
import { CalendarLanguage, CalendarType, FormatName } from '../types';

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

  it('summarises project settings as year · first month · format', () => {
    const summary = getProjectSummary({
      name: 'x',
      createdAt: 0,
      lastOpenedAt: 0,
      startYear: 2026,
      firstMonthIndex: 2,
      lang: CalendarLanguage.RU,
      font: 'Montserrat',
      format: FormatName.A3_X,
      type: CalendarType.MultiPage,
    });

    expect(summary).toBe('2026 · Март · A3 горизонтальный');
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

  it('treats an auto-generated project name as not custom', () => {
    const name = getProjectName(2026, FormatName.A4_Y);

    expect(isCustomProjectName(name, 2026, FormatName.A4_Y)).toBe(false);
  });

  it('treats a typed project name as custom', () => {
    expect(isCustomProjectName('Бабушке', 2026, FormatName.A4_Y)).toBe(true);
  });

  it('treats a generated name for another year or format as custom', () => {
    const name = getProjectName(2025, FormatName.A4_Y);

    expect(isCustomProjectName(name, 2026, FormatName.A4_Y)).toBe(true);
    expect(isCustomProjectName(name, 2025, FormatName.A3_X)).toBe(true);
  });

  it('adds a missing year to the list, sorted', () => {
    expect(withYear([2026, 2027, 2028], 2024)).toEqual([2024, 2026, 2027, 2028]);
  });

  it('keeps the list as-is when the year is already there', () => {
    const years = [2026, 2027, 2028];

    expect(withYear(years, 2027)).toEqual([2026, 2027, 2028]);
  });
});
