import { truncateToWidth } from '@earendil-works/pi-tui';
import { FAST_STATUS_KEY } from './fast-mode';
import {
  computePanelWidths,
  framePanelBody,
  renderRow,
  SEPARATOR_WIDTH,
  type BuiltPanel,
} from './panel';
import { GREEN_DARK_FG, GREEN_FG, visibleWidth } from './utils';

const INTERNAL_STATUS_KEYS = new Set([FAST_STATUS_KEY]);
const MAX_LABEL_WIDTH = 12;

type StatusRow = {
  label: string;
  labelColor: string;
  value: string;
};

function formatStatusLabel(key: string): string {
  const packageName = key.replace(/^@[^/]+\//, '');
  const withoutPiPrefix = packageName.replace(/^pi[-_:]/, '');
  return withoutPiPrefix.replace(/[-_.:]+/g, ' ').trim() || key;
}

export function buildStatusPanel(
  statuses: ReadonlyMap<string, string> | null | undefined,
  maxInner: number,
): BuiltPanel | null {
  if (!statuses || statuses.size === 0) return null;

  const rawRows = Array.from(statuses.entries())
    .filter(([key, value]) => !INTERNAL_STATUS_KEYS.has(key) && value.trim().length > 0)
    .map(([key, value], index): StatusRow => ({
      label: formatStatusLabel(key),
      labelColor: index === 0 ? GREEN_FG : GREEN_DARK_FG,
      value,
    }));

  if (rawRows.length === 0) return null;

  const labelWidth = Math.max(
    4,
    Math.min(
      MAX_LABEL_WIDTH,
      rawRows.reduce((max, row) => Math.max(max, visibleWidth(row.label)), 0),
    ),
  );
  const rows = rawRows.map((row) => ({
    ...row,
    label: truncateToWidth(row.label, labelWidth, '…', true),
  }));

  const naturalContentWidth = rows.reduce(
    (max, row) => Math.max(max, labelWidth + SEPARATOR_WIDTH + visibleWidth(row.value)),
    0,
  );

  const { inner, contentWidth } = computePanelWidths({
    title: 'STATUS',
    naturalContentWidth,
    maxInner,
    minInner: 24,
  });

  return framePanelBody({
    title: 'STATUS',
    bodyLines: rows.map((entry) =>
      renderRow(entry.label, entry.labelColor, labelWidth, contentWidth, (valueWidth) =>
        truncateToWidth(entry.value, valueWidth, '…', true),
      ),
    ),
    inner,
    contentWidth,
  });
}
