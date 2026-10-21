/**
 * The install attribution window as one select value: `"15m"` for a window in
 * minutes, `"168h"` for one in hours. A link or template stores one or the
 * other; the API takes `attributionWindowMinutes` or `attributionWindowHours`.
 */

export const DEFAULT_INSTALL_WINDOW = '168h';

export const INSTALL_WINDOW_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours (1 day)' },
  { value: '72h', label: '72 hours (3 days)' },
  { value: '168h', label: '168 hours (7 days) - Default' },
  { value: '336h', label: '336 hours (14 days)' },
  { value: '720h', label: '720 hours (30 days)' },
  { value: '2160h', label: '2160 hours (90 days)' },
];

/** The select value for a stored window; minutes win when set. */
export function installWindowValue(minutes?: number | null, hours?: number | null): string {
  if (minutes) return `${minutes}m`;
  if (hours) return `${hours}h`;
  return DEFAULT_INSTALL_WINDOW;
}

/** The API fields for a select value. */
export function installWindowFields(value: string): { attributionWindowMinutes: number } | { attributionWindowHours: number } {
  const amount = parseInt(value, 10);
  return value.endsWith('m') ? { attributionWindowMinutes: amount } : { attributionWindowHours: amount };
}

/**
 * The options, plus `current` when it isn't one of them, so a window set
 * through the API shows as it is and survives a save.
 */
export function installWindowOptions(current?: string): ReadonlyArray<{ value: string; label: string }> {
  if (!current || INSTALL_WINDOW_OPTIONS.some((o) => o.value === current)) return INSTALL_WINDOW_OPTIONS;
  const amount = parseInt(current, 10);
  const label = current.endsWith('m')
    ? `${amount} minute${amount === 1 ? '' : 's'}`
    : `${amount} hour${amount === 1 ? '' : 's'}`;
  return [...INSTALL_WINDOW_OPTIONS, { value: current, label }];
}
