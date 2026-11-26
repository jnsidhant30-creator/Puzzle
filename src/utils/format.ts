/**
 * Formats an integer count with its singular or plural English unit label.
 */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${Math.abs(safeCount) === 1 ? singular : plural}`;
}
