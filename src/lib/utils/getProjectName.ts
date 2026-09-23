import { FormatName } from '../../types';
import getFormatLabel from './getFormatLabel';

/**
 * Auto-generated project name, e.g. `Календарь 2026 · A4 вертикальный`
 */
export default function getProjectName(startYear: number, format: FormatName): string {
  return `Календарь ${startYear} · ${getFormatLabel(format)}`;
}

/**
 * A name differing from the generated one for its year and format was typed by the user
 */
export function isCustomProjectName(name: string, startYear: number, format: FormatName): boolean {
  return name !== getProjectName(startYear, format);
}
