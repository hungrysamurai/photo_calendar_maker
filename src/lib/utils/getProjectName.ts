import { FormatName } from '../../types';
import getFormatLabel from './getFormatLabel';

/**
 * Auto-generated project name, e.g. `Календарь 2026 · A4 вертикальный`
 */
export default function getProjectName(startYear: number, format: FormatName): string {
  return `Календарь ${startYear} · ${getFormatLabel(format)}`;
}
