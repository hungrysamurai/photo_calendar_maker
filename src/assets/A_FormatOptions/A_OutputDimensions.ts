import { FormatName } from "../../../types";

export const A_outputFormats: OutputDimensions = {
  [FormatName.A6_Y]: { width: 1240, height: 1748 },
  [FormatName.A6_X]: { width: 1748, height: 1240 },
  [FormatName.A5_Y]: { width: 1748, height: 2480 },
  [FormatName.A5_X]: { width: 2480, height: 1748 },
  [FormatName.A4_Y]: { width: 2480, height: 3508 },
  [FormatName.A4_X]: { width: 3508, height: 2480 },
  [FormatName.A3_Y]: { width: 3508, height: 4961 },
  [FormatName.A3_X]: { width: 4961, height: 3508 },
  [FormatName.A2_Y]: { width: 4961, height: 7016 },
  [FormatName.A2_X]: { width: 7016, height: 4961 },
};
