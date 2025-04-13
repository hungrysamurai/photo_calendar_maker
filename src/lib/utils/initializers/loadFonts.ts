import opentype from "opentype.js";
import fontsData from "../../../assets/fontsData";

export const loadFonts = async (): Promise<LoadedFontsObject> => {
  const loadedFonts = {};

  for (const [fontTitle, fontVariants] of Object.entries(fontsData)) {
    const { fontNameBold, fontNameRegular } = fontVariants;

    const baseName =
      process.env.NODE_ENV === "production"
        ? "/projects/photo_calendar_maker/"
        : "/";

    const fontBoldBuffer = await fetch(`${baseName}${fontNameBold}.ttf`);
    const fontMeiumBuffer = await fetch(`${baseName}${fontNameRegular}.ttf`);

    const fonts = await Promise.all([fontBoldBuffer, fontMeiumBuffer].map(async (res) => {
      const buffer = res.arrayBuffer();
      return opentype.parse(await buffer);
    }));

    // const fontsArray = await Promise.all(fonts);
    loadedFonts[fontTitle] = fonts;
  }

  return loadedFonts;
};
