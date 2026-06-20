import { truncateToWidth } from '@earendil-works/pi-tui';
import { formatCompactTokens, formatTokenCount, GREEN_DARK_FG, GREEN_FG } from './utils';
import {
  computePanelWidths,
  framePanelBody,
  renderRow,
  SEPARATOR_WIDTH,
  type BuiltPanel,
} from './panel';

export type AgentSnapshot = {
  tokens: number | null;
  contextWindow: number;
  modelText: string;
};

type AgentRow = {
  label: string;
  labelColor: string;
  value: string;
};

export function buildAgentPanel(snapshot: AgentSnapshot, maxInner: number): BuiltPanel {
  const rightText = snapshot.contextWindow > 0 ? `max ${formatCompactTokens(snapshot.contextWindow)}` : undefined;
  const tokenText = snapshot.tokens === null ? 'unknown tokens' : `~${formatTokenCount(snapshot.tokens)} tokens`;

  const rows: AgentRow[] = [
    {
      label: 'context',
      labelColor: GREEN_FG,
      value: tokenText,
    },
    {
      label: 'model',
      labelColor: GREEN_DARK_FG,
      value: snapshot.modelText,
    },
  ];

  const labelWidth = rows.reduce((max, row) => Math.max(max, row.label.length), 0);
  const naturalContentWidth = rows.reduce(
    (max, row) => Math.max(max, labelWidth + SEPARATOR_WIDTH + row.value.length),
    0,
  );

  const { inner, contentWidth } = computePanelWidths({
    title: 'AGENT',
    rightText,
    naturalContentWidth,
    maxInner,
    minInner: 28,
  });

  return framePanelBody({
    title: 'AGENT',
    rightText,
    bodyLines: rows.map((entry) =>
      renderRow(entry.label, entry.labelColor, labelWidth, contentWidth, (valueWidth) =>
        truncateToWidth(entry.value, valueWidth, '…', true),
      ),
    ),
    inner,
    contentWidth,
  });
}
