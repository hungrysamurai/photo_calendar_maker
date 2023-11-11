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

    const fontBoldBuffer = fetch(`${baseName}${fontNameBold}.ttf`);
    const fontMeiumBuffer = fetch(`${baseName}${fontNameRegular}.ttf`);

    const requests = await Promise.all([fontBoldBuffer, fontMeiumBuffer]).then(
      (requestsArray) => {
        const results = requestsArray.map(async (req) => {
          const buffer = req.arrayBuffer();
          return opentype.parse(await buffer, {});
        });
        return results;
      }
    );

    const fontsArray = await Promise.all(requests);
    loadedFonts[fontTitle] = fontsArray;
  }

  return loadedFonts;
};
