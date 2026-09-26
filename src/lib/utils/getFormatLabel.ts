import { FormatName } from '../../types';

/**
 * Human-readable label of a paper format, e.g. `A4 вертикальный`
 */
export default function getFormatLabel(format: FormatName): string {
  const formatPrefix = format.slice(0, 2);

  if (format.endsWith('Y')) {
    return `${formatPrefix} вертикальный`;
  } else {
    return `${formatPrefix} горизонтальный`;
  }
}
