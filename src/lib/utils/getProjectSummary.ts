import getFormatLabel from './getFormatLabel';
import { getMonthsList } from './getMonthsList';

/**
 * Short settings summary shown under a project name, e.g. `2026 · Январь · A4 вертикальный`
 */
export default function getProjectSummary(project: CalendarData): string {
  const month = getMonthsList()[project.firstMonthIndex];

  return `${project.startYear} · ${month} · ${getFormatLabel(project.format)}`;
}
