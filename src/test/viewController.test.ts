import { describe, expect, it, vi } from 'vitest';

import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../assets/A_FormatOptions/A_FormatOptions';
import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';
import ViewController, {
  ViewControllerOptions,
} from '../lib/entities/ViewController/ViewController';
import getWeekDays from '../lib/utils/getWeekDays';
import { getMonthsList } from '../lib/utils/getMonthsList';
import { CalendarLanguage, CalendarType, FontSubfamily, FormatName } from '../types';

vi.mock('gsap', () => ({
  default: { timeline: () => ({ fromTo: vi.fn().mockReturnThis() }) },
}));

const createEmbeddableFont = (family: string): EmbeddableFont => ({
  family,
  bytes: new ArrayBuffer(0),
  base64: `${family}==`,
  fontFace: `@font-face { font-family: '${family}'; src: url(data:font/truetype;base64,${family}==) format('truetype'); }`,
  vfs: { family, fileName: `${family}.ttf`, base64: `${family}==` },
});

const font: FontData = {
  [FontSubfamily.Bold]: createEmbeddableFont('MontserratBold'),
  [FontSubfamily.Regular]: createEmbeddableFont('MontserratMedium'),
};

const format = FormatName.A4_Y;

const createOptions = (
  type: CalendarType,
  lang: CalendarLanguage = CalendarLanguage.EN,
): ViewControllerOptions => {
  const mainContainer = document.createElement('div');
  const controlsContainer = document.createElement('div');
  document.body.append(mainContainer, controlsContainer);

  const mockupOptions =
    type === CalendarType.SinglePage
      ? new A_FormatSinglePageMockupOptions(format)[format]
      : new A_FormatMultiPageMockupOptions(format)[format];

  return {
    mainContainer,
    controlsContainer,
    type,
    mockupOptions,
    outputDimensions: A_outputFormats,
    format,
    firstMonthIndex: 0,
    year: 2026,
    font,
    lang,
    storedImages: [],
    actionsHandlers: {
      onDownloadCurrentPdf: vi.fn(),
      onDownloadJpg: vi.fn(),
      onCrop: vi.fn(),
      onUploadImage: vi.fn(),
      onDownloadAllPdf: vi.fn(),
      onUploadMultipleImages: vi.fn(),
    },
    showLoader: vi.fn(),
    hideLoader: vi.fn(),
  };
};

// Day-cell digits: numeric <text> nodes that are not the year title
const getDigits = (mockup: SVGElement) =>
  Array.from(mockup.querySelectorAll('text')).filter(
    (t) => /^\d+$/.test(t.textContent ?? '') && t.closest('[id^="year-title"]') === null,
  );

describe.each([
  { type: CalendarType.SinglePage, expectedMockups: 1, weekDayLength: 'short' as const },
  { type: CalendarType.MultiPage, expectedMockups: 12, weekDayLength: 'long' as const },
])('ViewController ($type)', ({ type, expectedMockups, weekDayLength }) => {
  it('embeds @font-face rules for both weights into every mockup svg', () => {
    const options = createOptions(type);
    const vc = new ViewController(options);

    expect(vc.svgMockups).toHaveLength(expectedMockups);

    vc.svgMockups.forEach((mockup) => {
      const styles = mockup.querySelectorAll('style');

      expect(styles).toHaveLength(1);
      expect(styles[0].textContent).toContain(font.bold.fontFace);
      expect(styles[0].textContent).toContain(font.regular.fontFace);
    });
  });

  it('renders day digits as centered <text> at the cell center', () => {
    const options = createOptions(type);
    const { dayCellWidth, dayCellHeight, daysFontSize } = options.mockupOptions;
    const vc = new ViewController(options);

    // January 2026 starts on Thursday (index 3 with Monday-first week): 3 prev-month days, 31 days, 8 next-month days
    const digits = getDigits(vc.svgMockups[0]);
    expect(digits.length).toBeGreaterThanOrEqual(42);
    expect(digits.slice(0, 42).map((t) => t.textContent)).toEqual([
      ...['29', '30', '31'],
      ...Array.from({ length: 31 }, (_, i) => `${i + 1}`),
      ...Array.from({ length: 8 }, (_, i) => `${i + 1}`),
    ]);

    digits.forEach((text) => {
      expect(text.getAttribute('text-anchor')).toBe('middle');
      expect(text.getAttribute('dominant-baseline')).toBe('central');
      expect(text.getAttribute('alignment-baseline')).toBe('central');
      expect(text.getAttribute('x')).toBe(`${dayCellWidth / 2}`);
      expect(text.getAttribute('y')).toBe(`${dayCellHeight / 2}`);
      expect(text.getAttribute('font-size')).toBe(`${daysFontSize}`);
      expect(text.closest('g')?.querySelector('path')).toBeNull();
    });
  });

  it('uses bold family and dark fill for current month, regular family and #999 for adjacent months', () => {
    const vc = new ViewController(createOptions(type));

    const digits = getDigits(vc.svgMockups[0]).slice(0, 42);
    const prev = digits.slice(0, 3);
    const current = digits.slice(3, 34);
    const next = digits.slice(34);

    [...prev, ...next].forEach((text) => {
      expect(text.getAttribute('fill')).toBe('#999');
      expect(text.getAttribute('font-family')).toBe('MontserratMedium');
    });

    current.forEach((text) => {
      expect(text.getAttribute('fill')).toBe('#231f20');
      expect(text.getAttribute('font-family')).toBe('MontserratBold');
    });
  });
  it.each([CalendarLanguage.RU, CalendarLanguage.EN])(
    'renders week day labels as centered bold <text> (%s)',
    (lang) => {
      const options = createOptions(type, lang);
      const { weekDayX, weekDayY, weekDayFontSize } = options.mockupOptions;
      const vc = new ViewController(options);

      const expectedLabels = getWeekDays(weekDayLength, lang);

      // Single-page: 12 label groups on one mockup; multi-page: one group per mockup
      const labelGroups = vc.svgMockups.flatMap((mockup) =>
        Array.from(mockup.querySelectorAll('[id^="week-days-titles"], [id^="days-titles"]')),
      );
      expect(labelGroups).toHaveLength(12);

      labelGroups.forEach((group) => {
        const labels = Array.from(group.querySelectorAll('text'));

        expect(labels.map((t) => t.textContent)).toEqual(expectedLabels);

        labels.forEach((text) => {
          expect(text.getAttribute('text-anchor')).toBe('middle');
          expect(text.getAttribute('dominant-baseline')).toBe('central');
          expect(text.getAttribute('alignment-baseline')).toBe('central');
          expect(text.getAttribute('x')).toBe(`${weekDayX}`);
          expect(text.getAttribute('y')).toBe(`${weekDayY}`);
          expect(text.getAttribute('font-size')).toBe(`${weekDayFontSize}`);
          expect(text.getAttribute('font-family')).toBe('MontserratBold');
          expect(text.getAttribute('fill')).toBe('#231f20');
        });
      });
    },
  );

  it.each([CalendarLanguage.RU, CalendarLanguage.EN])(
    'renders month and year titles as start-anchored <text> at configured position (%s)',
    (lang) => {
      const options = createOptions(type, lang);
      const {
        monthTitleX,
        monthTitleY,
        monthTitleFontSize,
        yearTitleX,
        yearTitleY,
        yearTitleFontSize,
      } = options.mockupOptions;
      const vc = new ViewController(options);

      const monthsList = getMonthsList(lang);

      const monthTitles = Array.from(vc.svgMockups[0].querySelectorAll('[id^="month-title"] text'));
      const yearTitles = Array.from(vc.svgMockups[0].querySelectorAll('[id^="year-title"] text'));

      expect(monthTitles.length).toBeGreaterThan(0);
      expect(monthTitles.length).toBe(yearTitles.length);

      monthTitles.forEach((text, i) => {
        expect(text.textContent).toBe(monthsList[i]);
        expect(text.getAttribute('text-anchor')).toBe('start');
        expect(text.hasAttribute('dominant-baseline')).toBe(false);
        expect(text.getAttribute('x')).toBe(`${monthTitleX}`);
        expect(text.getAttribute('y')).toBe(`${monthTitleY}`);
        expect(text.getAttribute('font-size')).toBe(`${monthTitleFontSize}`);
        expect(text.getAttribute('font-family')).toBe('MontserratBold');
        expect(text.getAttribute('fill')).toBe('#231f20');
      });

      yearTitles.forEach((text) => {
        expect(text.textContent).toBe('2026');
        expect(text.getAttribute('text-anchor')).toBe('start');
        expect(text.hasAttribute('dominant-baseline')).toBe(false);
        expect(text.getAttribute('x')).toBe(`${yearTitleX}`);
        expect(text.getAttribute('y')).toBe(`${yearTitleY}`);
        expect(text.getAttribute('font-size')).toBe(`${yearTitleFontSize}`);
        expect(text.getAttribute('font-family')).toBe('MontserratBold');
        expect(text.getAttribute('fill')).toBe('#231f20');
      });
    },
  );

  it('renders no outline <path> text anywhere in a mockup (only the placeholder icon)', () => {
    const vc = new ViewController(createOptions(type));

    vc.svgMockups.forEach((mockup) => {
      const pathsOutsideImageGroup = Array.from(mockup.querySelectorAll('path')).filter(
        (p) => p.closest('#image-group') === null,
      );

      expect(pathsOutsideImageGroup).toHaveLength(0);
    });
  });
});
