import { FormatName } from "../../../../types";
import { A_outputFormats } from "../../../assets/A_FormatOptions/A_OutputDimensions";

export const createFormatsOptions = (
  defaultFormat: FormatName = FormatName.A4_Y
) => {
  return Object.keys(A_outputFormats)
    .map((format, i) => {
      return `<option value=${format} ${
        format === defaultFormat ? "selected" : ""
      }>${format}</option>`;
    })
    .join("");
};
