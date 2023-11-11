import fontsData from "../../../assets/fontsData";

/**
 * @property {Function} createFontsOptions - Generate fonts options for input
 */
export const createFontsOptions = (): string => {
  return Object.keys(fontsData)
    .map((fontName) => {
      return `<option value=${fontName}>${fontName}</option>`;
    })
    .join("");
};
