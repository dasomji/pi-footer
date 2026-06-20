import { truncateToWidth } from '@earendil-works/pi-tui';
import { GREEN_DARK_FG, GREEN_FG } from './utils';
import {
  computePanelWidths,
  framePanelBody,
  renderRow,
  SEPARATOR_WIDTH,
  type BuiltPanel,
} from './panel';

export type GitInfo = {
  inRepo: boolean;
  worktree: string;
  branch: string;
  tracking: string;
  ahead: number;
  behind: number;
};

export const EMPTY_GIT_STATE: GitInfo = {
  inRepo: false,
  worktree: '-',
  branch: '-',
  tracking: '(no repository)',
  ahead: 0,
  behind: 0,
};

type GitRow = {
  label: string;
  value: string;
  labelColor?: string;
};

function buildRepositoryRows(snapshot: GitInfo): GitRow[] {
  const expectedTracking = `origin/${snapshot.branch}`;
  const shouldShowTracking =
    snapshot.tracking === '(no upstream)' || snapshot.tracking !== expectedTracking;

  const rows: GitRow[] = [
    { label: 'worktree', value: snapshot.worktree, labelColor: GREEN_FG },
    { label: 'branch', value: snapshot.branch, labelColor: GREEN_DARK_FG },
  ];

  if (shouldShowTracking) {
    rows.push({ label: 'tracking', value: snapshot.tracking, labelColor: GREEN_DARK_FG });
  }

  return rows;
}

export function buildGitPanel(snapshot: GitInfo, maxInner: number): BuiltPanel {
  const rows: GitRow[] = snapshot.inRepo
    ? buildRepositoryRows(snapshot)
    : [
        { label: 'directory', value: snapshot.worktree, labelColor: GREEN_FG },
        { label: 'git', value: 'no git initialised', labelColor: GREEN_DARK_FG },
      ];

  const labelWidth = rows.reduce((max, row) => Math.max(max, row.label.length), 0);
  const right = snapshot.inRepo ? `↑${snapshot.ahead} ↓${snapshot.behind}` : undefined;

  const naturalContentWidth = rows.reduce(
    (max, row) => Math.max(max, labelWidth + SEPARATOR_WIDTH + row.value.length),
    0,
  );

  const { inner, contentWidth } = computePanelWidths({
    title: 'GIT',
    rightText: right,
    naturalContentWidth,
    maxInner,
    minInner: 24,
  });

  return framePanelBody({
    title: 'GIT',
    rightText: right,
    bodyLines: rows.map((entry) =>
      renderRow(entry.label, entry.labelColor, labelWidth, contentWidth, (valueWidth) =>
        truncateToWidth(entry.value, valueWidth, '…', true),
      ),
    ),
    inner,
    contentWidth,
  });
}
