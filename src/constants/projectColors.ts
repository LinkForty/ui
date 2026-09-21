/**
 * Preset palette for project colors. A fixed set (rather than free-form hex) so
 * the links-table pill has a readable light + dark variant for every choice —
 * arbitrary hex can't guarantee dark-mode contrast.
 *
 * The stored value on a project is the `key` (e.g. "purple"). `pillClass` drives
 * the links-table pill; `swatchClass` is the solid fill for the picker tile.
 *
 * NOTE: every class string below must appear as a literal here so Tailwind (which
 * scans packages/ui/src) generates them into the consuming app's CSS bundle.
 */
export interface ProjectColorOption {
  key: string;
  label: string;
  swatchClass: string;
  pillClass: string;
}

export const PROJECT_COLORS: ProjectColorOption[] = [
  { key: 'purple', label: 'Purple', swatchClass: 'bg-purple-500', pillClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { key: 'blue', label: 'Blue', swatchClass: 'bg-blue-500', pillClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { key: 'teal', label: 'Teal', swatchClass: 'bg-teal-500', pillClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  { key: 'green', label: 'Green', swatchClass: 'bg-green-500', pillClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { key: 'amber', label: 'Amber', swatchClass: 'bg-amber-500', pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { key: 'orange', label: 'Orange', swatchClass: 'bg-orange-500', pillClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { key: 'red', label: 'Red', swatchClass: 'bg-red-500', pillClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { key: 'pink', label: 'Pink', swatchClass: 'bg-pink-500', pillClass: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  { key: 'indigo', label: 'Indigo', swatchClass: 'bg-indigo-500', pillClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { key: 'gray', label: 'Gray', swatchClass: 'bg-gray-500', pillClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
];

/** Fallback when a project has no color set — matches the pill's historical purple. */
export const DEFAULT_PROJECT_COLOR = 'purple';

/** Pill background/text classes for a stored project color key (falls back to the default). */
export function projectPillClasses(color?: string | null): string {
  const found = PROJECT_COLORS.find((c) => c.key === color);
  return (found ?? PROJECT_COLORS[0]).pillClass;
}
