import { beforeEach, describe, expect, it, vi } from 'vitest';

import jsPDF from 'jspdf';
import DownloadManager from '../lib/entities/DownloadManager';
import { CalendarLanguage, CalendarType, FormatName, PDFPagesRangeToDownload } from '../types';
import SVGToCanvasBlob from '../lib/utils/SVGToCanvasBlob';

vi.mock('../lib/utils/SVGToCanvasBlob', () => ({
  default: vi.fn(async () => new Blob(['jpg'], { type: 'image/jpeg' })),
}));

// Single shared log of jsPDF calls, in order, so font registration can be checked against svg()
const pdfCalls: { method: string; args: unknown[] }[] = [];

const createPDFMethod = (method: string) =>
  vi.fn((...args: unknown[]) => {
    pdfCalls.push({ method, args });
  });

vi.mock('jspdf', () => ({
  default: vi.fn(function () {
    return {
      setFont: createPDFMethod('setFont'),
      setFontSize: createPDFMethod('setFontSize'),
      // Fixed 4 units per character: '17' → 8 wide
      getTextWidth: vi.fn((text: string) => text.length * 4),
      addFileToVFS: createPDFMethod('addFileToVFS'),
      addFont: createPDFMethod('addFont'),
      svg: createPDFMethod('svg'),
      addImage: createPDFMethod('addImage'),
      addPage: createPDFMethod('addPage'),
      save: createPDFMethod('save'),
    };
  }),
}));
vi.mock('svg2pdf.js', () => ({}));
vi.mock('../lib/utils/getImageSize', () => ({
  default: vi.fn(async () => ({ width: 100, height: 80 })),
}));

const rasterize = vi.mocked(SVGToCanvasBlob);

const boldFontFace =
  "@font-face { font-family: 'TestBold'; src: url(data:font/truetype;base64,QUJD) format('truetype'); }";
const regularFontFace =
  "@font-face { font-family: 'TestRegular'; src: url(data:font/truetype;base64,REVG) format('truetype'); }";

const createFont = () => ({
  bold: {
    family: 'TestBold',
    fontFace: boldFontFace,
    vfs: { family: 'TestBold', fileName: 'TestBold.ttf', base64: 'QUJD' },
  },
  regular: {
    family: 'TestRegular',
    fontFace: regularFontFace,
    vfs: { family: 'TestRegular', fileName: 'TestRegular.ttf', base64: 'REVG' },
  },
});

const createMockup = (withStyle: boolean) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.dataset.year = '2026';
  svg.dataset.month = '0';

  if (withStyle) {
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `${boldFontFace}\n${regularFontFace}`;
    svg.appendChild(style);
  }

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.textContent = '17';
  text.setAttribute('x', '10');
  text.setAttribute('y', '5');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-family', 'TestBold');
  text.setAttribute('font-size', '1.7');
  svg.appendChild(text);

  return svg;
};

const createMockOptions = (overrides: Record<string, unknown> = {}) => {
  const mockup = createMockup(true);

  return {
    calendarType: CalendarType.MultiPage,
    lang: CalendarLanguage.EN,
    calendarFirstMonth: 0,
    calendarStartYear: 2026,
    calendarLastMonth: 11,
    calendarEndYear: 2026,
    format: FormatName.A4_Y,
    outputDimensions: { A4_Y: { width: 100, height: 100 } },
    mockupOptions: {
      mockupWidth: 210,
      mockupHeight: 297,
      imagePlaceholderWidth: 100,
      imagePlaceholderHeight: 80,
      imagePlaceholderX: 10,
      imagePlaceholderY: 20,
    },
    svgMockups: [mockup],
    storedImages: [],
    font: createFont(),
    getCurrentMonth: () => 0,
    getCurrentMockup: vi.fn(() => mockup),
    showLoader: vi.fn(),
    hideLoader: vi.fn(),
    ...overrides,
  };
};

const getRasterizedSVG = () => rasterize.mock.calls[0][0];

describe('DownloadManager JPG export', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    rasterize.mockClear();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('hands rasterizer an SVG carrying both @font-face rules of the selected font', async () => {
    const options = createMockOptions();
    const manager = new DownloadManager(options as never);

    await manager.downloadCurrentJPG();

    expect(rasterize).toHaveBeenCalledTimes(1);

    const svg = getRasterizedSVG();
    const styles = Array.from(svg.querySelectorAll('style'));

    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain(boldFontFace);
    expect(styles[0].textContent).toContain(regularFontFace);
    expect(options.hideLoader).toHaveBeenCalled();
  });

  it('re-injects @font-face rules when the cloned SVG lacks a style element', async () => {
    const mockup = createMockup(false);
    const options = createMockOptions({ svgMockups: [mockup], getCurrentMockup: () => mockup });
    const manager = new DownloadManager(options as never);

    await manager.downloadCurrentJPG();

    const svg = getRasterizedSVG();
    const style = svg.querySelector('style');

    expect(style).not.toBeNull();
    expect(style?.textContent).toContain(boldFontFace);
    expect(style?.textContent).toContain(regularFontFace);
    // Original mockup in the live preview is untouched
    expect(mockup.querySelector('style')).toBeNull();
  });

  it('does not rasterize or download when font data is missing', async () => {
    const options = createMockOptions({ font: undefined });
    const manager = new DownloadManager(options as never);
    const click = vi.mocked(HTMLAnchorElement.prototype.click);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await manager.downloadCurrentJPG();

    expect(rasterize).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
    expect(options.showLoader).toHaveBeenCalled();
    expect(options.hideLoader).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Failed to download image:', expect.any(Error));
  });

  it('does not rasterize when one weight lacks embeddable data', async () => {
    const font = createFont();
    const options = createMockOptions({ font: { bold: font.bold, regular: {} } });
    const manager = new DownloadManager(options as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await manager.downloadCurrentJPG();

    expect(rasterize).not.toHaveBeenCalled();
    expect(options.hideLoader).toHaveBeenCalled();
  });
});

describe('DownloadManager PDF export', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pdfCalls.length = 0;
  });

  const methods = () => pdfCalls.map((call) => call.method);

  const expectFontsRegisteredBeforeFirstSVG = () => {
    const firstSVG = methods().indexOf('svg');
    expect(firstSVG).toBeGreaterThan(-1);

    const beforeSVG = pdfCalls.slice(0, firstSVG);

    expect(beforeSVG.filter((call) => call.method === 'addFileToVFS').map((c) => c.args)).toEqual([
      ['TestBold.ttf', 'QUJD'],
      ['TestRegular.ttf', 'REVG'],
    ]);
    expect(beforeSVG.filter((call) => call.method === 'addFont').map((c) => c.args)).toEqual([
      ['TestBold.ttf', 'TestBold', 'normal'],
      ['TestRegular.ttf', 'TestRegular', 'normal'],
    ]);
  };

  it('registers both weights before first svg() call for current page range', async () => {
    const options = createMockOptions();
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.Current);

    expectFontsRegisteredBeforeFirstSVG();
    expect(methods().filter((m) => m === 'svg')).toHaveLength(1);
    expect(methods().filter((m) => m === 'addFileToVFS')).toHaveLength(2);
    expect(methods().at(-1)).toBe('save');
    expect(options.hideLoader).toHaveBeenCalled();
  });

  it('registers both weights once before first svg() call for all pages range', async () => {
    const mockups = [createMockup(true), createMockup(true), createMockup(true)];
    const options = createMockOptions({ svgMockups: mockups, getCurrentMockup: () => mockups[0] });
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.All);

    expectFontsRegisteredBeforeFirstSVG();
    expect(methods().filter((m) => m === 'svg')).toHaveLength(3);
    expect(methods().filter((m) => m === 'addPage')).toHaveLength(2);
    // Registration happens once per document, not per page
    expect(methods().filter((m) => m === 'addFileToVFS')).toHaveLength(2);
    expect(methods().filter((m) => m === 'addFont')).toHaveLength(2);
    expect(methods().at(-1)).toBe('save');
  });

  it('declares image format from stored blob type so PNGs are not decoded as JPEG', async () => {
    const png = new Blob(['png'], { type: 'image/png' });
    const jpeg = new Blob(['jpg'], { type: 'image/jpeg' });
    const mockups = [createMockup(true), createMockup(true)];
    const options = createMockOptions({
      svgMockups: mockups,
      storedImages: [
        { id: 0, image: png },
        { id: 1, image: jpeg },
      ],
    });
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.All);

    const formats = pdfCalls.filter((c) => c.method === 'addImage').map((c) => c.args[1]);
    expect(formats).toEqual(['PNG', 'JPEG']);
  });

  it('names file by month in calendar language, not browser locale', async () => {
    const options = createMockOptions({ lang: CalendarLanguage.RU });
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.Current);

    const saveCall = pdfCalls.find((c) => c.method === 'save');
    expect(saveCall?.args[0]).toBe('январь_2026');
  });

  it('builds document in points so jsPDF baseline offsets are not scaled down', async () => {
    const options = createMockOptions();
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.Current);

    const mmToPt = 72 / 25.4;
    expect(vi.mocked(jsPDF)).toHaveBeenLastCalledWith('p', 'pt', [210 * mmToPt, 297 * mmToPt]);

    const svgCall = pdfCalls.find((call) => call.method === 'svg');
    expect(svgCall?.args[1]).toEqual({ x: 0, y: 0, width: 210 * mmToPt, height: 297 * mmToPt });
  });

  it('centers text from embedded font metrics instead of svg2pdf browser measurement', async () => {
    const mockup = createMockup(true);
    const options = createMockOptions({ svgMockups: [mockup], getCurrentMockup: () => mockup });
    const manager = new DownloadManager(options as never);

    await manager.downloadPDF(PDFPagesRangeToDownload.Current);

    const svgCall = pdfCalls.find((call) => call.method === 'svg');
    const text = (svgCall?.args[0] as SVGElement).querySelector('text');

    expect(text?.getAttribute('text-anchor')).toBe('start');
    // 10 - (2 chars * 4) / 2
    expect(text?.getAttribute('x')).toBe('6');
    expect(text?.getAttribute('y')).toBe('5');
    expect(pdfCalls.find((c) => c.method === 'setFont')?.args).toEqual(['TestBold', 'normal']);
    expect(pdfCalls.find((c) => c.method === 'setFontSize')?.args).toEqual([1.7]);
    // Live preview mockup is untouched
    expect(mockup.querySelector('text')?.getAttribute('text-anchor')).toBe('middle');
  });

  it('does not render or save PDF when font data is missing', async () => {
    const options = createMockOptions({ font: undefined });
    const manager = new DownloadManager(options as never);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await manager.downloadPDF(PDFPagesRangeToDownload.All);

    expect(methods()).not.toContain('svg');
    expect(methods()).not.toContain('save');
    expect(options.showLoader).toHaveBeenCalled();
    expect(options.hideLoader).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Failed to download PDF:', expect.any(Error));
  });

  it('does not render PDF when one weight lacks VFS data', async () => {
    const font = createFont();
    const options = createMockOptions({
      font: { bold: font.bold, regular: { family: 'TestRegular', fontFace: regularFontFace } },
    });
    const manager = new DownloadManager(options as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await manager.downloadPDF(PDFPagesRangeToDownload.Current);

    expect(methods()).not.toContain('svg');
    expect(options.hideLoader).toHaveBeenCalled();
  });
});
