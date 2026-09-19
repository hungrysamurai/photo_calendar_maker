import { describe, expect, it, vi } from 'vitest';

import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../assets/A_FormatOptions/A_FormatOptions';
import { A_outputFormats } from '../assets/A_FormatOptions/A_OutputDimensions';
import ViewController, {
  ViewControllerOptions,
} from '../lib/entities/ViewController/ViewController';
import { CalendarLanguage, CalendarType, FontSubfamily, FormatName } from '../types';

vi.mock('gsap', () => ({
  default: { timeline: () => ({ fromTo: vi.fn().mockReturnThis() }) },
}));

// Titles and week day labels are still outline-rendered in this phase — stub opentype Font
const fakeOutlineFont = {
  getPath: () => ({
    fill: '',
    toSVG: () => '',
    toPathData: () => '',
    getBoundingBox: () => ({ x1: 0, x2: 0, y1: 0, y2: 0 }),
  }),
};

const createEmbeddableFont = (family: string): EmbeddableFont => ({
  family,
  bytes: new ArrayBuffer(0),
  base64: `${family}==`,
  fontFace: `@font-face { font-family: '${family}'; src: url(data:font/truetype;base64,${family}==) format('truetype'); }`,
  vfs: { family, fileName: `${family}.ttf`, base64: `${family}==` },
  font: fakeOutlineFont as never,
});

const font: FontData = {
  [FontSubfamily.Bold]: createEmbeddableFont('MontserratBold'),
  [FontSubfamily.Regular]: createEmbeddableFont('MontserratMedium'),
};

const format = FormatName.A4_Y;

const createOptions = (type: CalendarType): ViewControllerOptions => {
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
    lang: CalendarLanguage.EN,
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

const getDigits = (mockup: SVGElement) =>
  Array.from(mockup.querySelectorAll('text')).filter((t) => /^\d+$/.test(t.textContent ?? ''));

describe.each([
  { type: CalendarType.SinglePage, expectedMockups: 1 },
  { type: CalendarType.MultiPage, expectedMockups: 12 },
])('ViewController ($type)', ({ type, expectedMockups }) => {
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
});
