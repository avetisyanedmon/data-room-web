const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Byte formatting that survives BigInt-as-string payloads (`totalSize`) and
 * scales past MB — the previous helper rendered a 3.4 GB room as "3400.0 MB".
 */
export function formatBytes(value: number | string | bigint): string {
  const bytes = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 || size >= 100 ? 0 : 1;
  return `${size.toFixed(decimals)} ${UNITS[unit]}`;
}

export function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
];

export function formatRelative(value: string): string {
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return '—';

  let delta = (target - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  for (const [unit, step] of RELATIVE_STEPS) {
    if (Math.abs(delta) < step) {
      return formatter.format(Math.round(delta), unit);
    }
    delta /= step;
  }
  return formatDate(value);
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** `Report.pdf` -> `{ stem: 'Report', ext: '.pdf' }` — mirrors the server's splitter. */
export function splitFileName(filename: string): { stem: string; ext: string } {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return { stem: filename, ext: '' };
  }
  return { stem: filename.slice(0, lastDot), ext: filename.slice(lastDot) };
}
