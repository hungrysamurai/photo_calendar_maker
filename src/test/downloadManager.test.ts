import { beforeEach, describe, expect, it, vi } from 'vitest';

import DownloadManager from '../lib/entities/DownloadManager';
import { CalendarType, FormatName } from '../types';
import SVGToCanvasBlob from '../lib/utils/SVGToCanvasBlob';

vi.mock('../lib/utils/SVGToCanvasBlob', () => ({
  default: vi.fn(async () => new Blob(['jpg'], { type: 'image/jpeg' })),
}));

const rasterize = vi.mocked(SVGToCanvasBlob);

const boldFontFace =
  "@font-face { font-family: 'TestBold'; src: url(data:font/truetype;base64,QUJD) format('truetype'); }";
const regularFontFace =
  "@font-face { font-family: 'TestRegular'; src: url(data:font/truetype;base64,REVG) format('truetype'); }";

const createFont = () => ({
  bold: { family: 'TestBold', fontFace: boldFontFace },
  regular: { family: 'TestRegular', fontFace: regularFontFace },
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
  text.textContent = '1';
  svg.appendChild(text);

  return svg;
};

const createMockOptions = (overrides: Record<string, unknown> = {}) => {
  const mockup = createMockup(true);

  return {
    calendarType: CalendarType.MultiPage,
    calendarFirstMonth: 0,
    calendarStartYear: 2026,
    calendarLastMonth: 11,
    calendarEndYear: 2026,
    format: FormatName.A4_Y,
    outputDimensions: { A4_Y: { width: 100, height: 100 } },
    mockupOptions: {
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
