import { A_outputFormats } from '../../../../assets/A_FormatOptions/A_OutputDimensions';
import { FormatName } from '../../../../types';

export const createFormatsOptions = (defaultFormat: FormatName = FormatName.A4_Y) => {
  return Object.keys(A_outputFormats)
    .map((format) => {
      return `<option value=${format} 
      ${format === defaultFormat ? 'selected' : ''}>${format}</option>`;
    })
    .join('');
};
