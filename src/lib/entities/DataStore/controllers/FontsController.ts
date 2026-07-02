import opentype from 'opentype.js';

export default class FontsController {
  fonts: LoadedFontsObject = {};

  public async loadFonts(src: SourceFontsData): Promise<void> {
    for (const [fontTitle, fontVariants] of Object.entries(src)) {
      const { fontNameBold, fontNameRegular } = fontVariants;

      const fontBoldBuffer = await fetch(`${import.meta.env.BASE_URL}${fontNameBold}.ttf`);
      const fontMeiumBuffer = await fetch(`${import.meta.env.BASE_URL}${fontNameRegular}.ttf`);

      const fonts = await Promise.all(
        [fontBoldBuffer, fontMeiumBuffer].map(async (res) => {
          return opentype.parse(await res.arrayBuffer());
        }),
      );

      this.fonts[fontTitle] = fonts;
    }
  }

  public getFont(font: string): FontData {
    return {
      bold: this.fonts[font][0],
      regular: this.fonts[font][1],
    };
  }
}
