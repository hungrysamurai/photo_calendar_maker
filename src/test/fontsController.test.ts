import { afterEach, describe, expect, it, vi } from 'vitest';

import FontsController, {
  createFontFaceRule,
} from '../lib/entities/DataController/controllers/FontsController';
import { FontSubfamily } from '../types';

vi.mock('opentype.js', () => ({
  default: { parse: vi.fn(() => ({ parsed: true })) },
}));

const fontBytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

const mockFetch = (files: Record<string, ArrayBuffer>) =>
  vi.fn(async (url: string) => {
    const name = url.split('/').pop() as string;
    const bytes = files[name];

    return {
      ok: Boolean(bytes),
      status: bytes ? 200 : 404,
      arrayBuffer: async () => bytes,
    } as Response;
  });

const sourceFonts = {
  Montserrat: { fontNameBold: 'MontserratBold', fontNameRegular: 'MontserratMedium' },
} as unknown as SourceFontsData;

describe('FontsController', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes family name and @font-face block with base64 data URL for a loaded weight', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'MontserratBold.ttf': fontBytes('bold-bytes'),
        'MontserratMedium.ttf': fontBytes('regular-bytes'),
      }),
    );

    const controller = new FontsController();
    await controller.loadFonts(sourceFonts);

    const bold = controller.getEmbeddableFont('Montserrat', FontSubfamily.Bold);
    const regular = controller.getEmbeddableFont('Montserrat', FontSubfamily.Regular);

    expect(bold.family).toBe('MontserratBold');
    expect(bold.base64).toBe(btoa('bold-bytes'));
    expect(bold.fontFace).toContain("font-family: 'MontserratBold'");
    expect(bold.fontFace).toContain(`url(data:font/truetype;base64,${btoa('bold-bytes')})`);
    expect(bold.fontFace).toContain("format('truetype')");

    expect(regular.family).toBe('MontserratMedium');
    expect(regular.base64).toBe(btoa('regular-bytes'));
    expect(regular.fontFace).toContain("font-family: 'MontserratMedium'");
  });

  it('exposes VFS-ready data with family name, file name and base64 payload per weight', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'MontserratBold.ttf': fontBytes('bold-bytes'),
        'MontserratMedium.ttf': fontBytes('regular-bytes'),
      }),
    );

    const controller = new FontsController();
    await controller.loadFonts(sourceFonts);

    expect(controller.getVFSFontData('Montserrat', FontSubfamily.Bold)).toEqual({
      family: 'MontserratBold',
      fileName: 'MontserratBold.ttf',
      base64: btoa('bold-bytes'),
    });
    expect(controller.getVFSFontData('Montserrat', FontSubfamily.Regular)).toEqual({
      family: 'MontserratMedium',
      fileName: 'MontserratMedium.ttf',
      base64: btoa('regular-bytes'),
    });
    expect(controller.getEmbeddableFont('Montserrat', FontSubfamily.Bold).vfs).toEqual(
      controller.getVFSFontData('Montserrat', FontSubfamily.Bold),
    );
  });

  it('returns @font-face rules for both weights of a font', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({
        'MontserratBold.ttf': fontBytes('b'),
        'MontserratMedium.ttf': fontBytes('r'),
      }),
    );

    const controller = new FontsController();
    await controller.loadFonts(sourceFonts);

    const css = controller.getFontFaceCSS('Montserrat');

    expect(css).toContain(createFontFaceRule('MontserratBold', btoa('b')));
    expect(css).toContain(createFontFaceRule('MontserratMedium', btoa('r')));
  });

  it('throws when requested font is not loaded', () => {
    const controller = new FontsController();

    expect(() => controller.getFont('Caveat')).toThrow(/not loaded/);
  });

  it('throws when a font file fails to fetch', async () => {
    vi.stubGlobal('fetch', mockFetch({ 'MontserratBold.ttf': fontBytes('b') }));

    const controller = new FontsController();

    await expect(controller.loadFonts(sourceFonts)).rejects.toThrow(/MontserratMedium/);
  });
});
