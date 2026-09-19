import opentype from 'opentype.js';

import { FontSubfamily } from '../../../../types';
import arrayBufferToBase64 from '../../../utils/arrayBufferToBase64';

/**
 * Build `@font-face` rule that embeds font bytes as base64 data URL
 */
export function createFontFaceRule(family: string, base64: string): string {
  return `@font-face { font-family: '${family}'; src: url(data:font/truetype;base64,${base64}) format('truetype'); }`;
}

/**
 * Build data needed to register font weight in jsPDF virtual file system
 */
export function createVFSFontData(family: string, base64: string): VFSFontData {
  return { family, fileName: `${family}.ttf`, base64 };
}

export default class FontsController {
  fonts: LoadedFontsObject = {};

  async loadFonts(src: SourceFontsData): Promise<void> {
    for (const [fontTitle, fontVariants] of Object.entries(src)) {
      const { fontNameBold, fontNameRegular } = fontVariants;

      const [bold, regular] = await Promise.all(
        [fontNameBold, fontNameRegular].map((fileName) => this.fetchFont(fileName)),
      );

      this.fonts[fontTitle] = { bold, regular };
    }
  }

  private async fetchFont(fileName: string): Promise<EmbeddableFont> {
    const res = await fetch(`${import.meta.env.BASE_URL}${fileName}.ttf`);

    if (!res.ok) {
      throw new Error(`Failed to load font ${fileName}.ttf: ${res.status}`);
    }

    const bytes = await res.arrayBuffer();
    const base64 = arrayBufferToBase64(bytes);

    return {
      family: fileName,
      bytes,
      base64,
      fontFace: createFontFaceRule(fileName, base64),
      vfs: createVFSFontData(fileName, base64),
      font: opentype.parse(bytes),
    };
  }

  getFont(font: string): FontData {
    const fontData = this.fonts[font];

    if (!fontData) {
      throw new Error(`Font "${font}" is not loaded`);
    }

    return fontData;
  }

  getEmbeddableFont(font: string, weight: FontSubfamily): EmbeddableFont {
    return this.getFont(font)[weight];
  }

  /**
   * jsPDF VFS-ready data for given font weight
   */
  getVFSFontData(font: string, weight: FontSubfamily): VFSFontData {
    return this.getEmbeddableFont(font, weight).vfs;
  }

  /**
   * `@font-face` rules for both weights of given font
   */
  getFontFaceCSS(font: string): string {
    const { bold, regular } = this.getFont(font);

    return `${bold.fontFace}\n${regular.fontFace}`;
  }
}
