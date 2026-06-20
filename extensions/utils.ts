import { visibleWidth } from '@earendil-works/pi-tui';

export { visibleWidth };

export const GOLD_FG = '\x1b[38;2;212;162;46m';
export const GREEN_FG = '\x1b[38;2;96;176;88m';
export const GREEN_DARK_FG = '\x1b[38;2;62;124;66m';
export const RESET_FG = '\x1b[39m';

export function tint(text: string, color: string): string {
  return `${color}${text}${RESET_FG}`;
}

export function gold(text: string): string {
  return tint(text, GOLD_FG);
}

export function padVisible(text: string, width: number): string {
  const deficit = width - visibleWidth(text);
  if (deficit <= 0) return text;
  return `${text}${' '.repeat(deficit)}`;
}

export function formatCompactTokens(tokens: number | null | undefined): string {
  if (tokens == null || Number.isNaN(tokens)) return '?';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`;
  return `${tokens}`;
}

export function formatTokenCount(tokens: number | null | undefined): string {
  if (tokens == null || Number.isNaN(tokens)) return 'unknown';
  return new Intl.NumberFormat('en-US').format(Math.round(tokens));
}

export function maxVisibleWidth(lines: string[]): number {
  return lines.reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
}
