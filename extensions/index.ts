import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { truncateToWidth } from '@earendil-works/pi-tui';
import { buildGitPanel, EMPTY_GIT_STATE, type GitInfo } from './git';
import { buildAgentPanel, type AgentSnapshot } from './info';
import { maxVisibleWidth, padVisible, visibleWidth } from './utils';

const REFRESH_MS = 5000;
const TICK_MS = 5000;
const GAP = ' ';

function parseCount(raw: string): { behind: number; ahead: number } {
  const [behindRaw, aheadRaw] = raw.trim().split(/\s+/);
  return {
    behind: Number.parseInt(behindRaw || '0', 10) || 0,
    ahead: Number.parseInt(aheadRaw || '0', 10) || 0,
  };
}

function combineSideBySide(left: string[], leftWidth: number, right: string[]): string[] {
  const rows = Math.max(left.length, right.length);
  const output: string[] = [];

  for (let i = 0; i < rows; i++) {
    const l = left[i] ?? ' '.repeat(leftWidth);
    const r = right[i] ?? '';
    output.push(`${padVisible(l, leftWidth)}${GAP}${r}`);
  }

  return output;
}

export default function piFooterExtension(pi: ExtensionAPI) {
  let ctxRef: ExtensionContext | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let renderRequest: (() => void) | null = null;
  let refreshingGit = false;
  let lastGitRefreshAt = 0;

  let gitState: GitInfo = EMPTY_GIT_STATE;
  let agentState: AgentSnapshot = {
    tokens: null,
    contextWindow: 0,
    modelText: '(no model)',
  };

  async function runGit(args: string[]): Promise<string | undefined> {
    if (!ctxRef) return undefined;

    try {
      const result = await pi.exec('git', args, { cwd: ctxRef.cwd, timeout: 2000 });
      if (result.code !== 0) return undefined;
      const value = result.stdout.trim();
      return value || undefined;
    } catch {
      return undefined;
    }
  }

  async function readGitInfo(): Promise<GitInfo> {
    const inside = await runGit(['rev-parse', '--is-inside-work-tree']);
    if (inside !== 'true') {
      return {
        ...EMPTY_GIT_STATE,
        worktree: ctxRef?.cwd || '-',
      };
    }

    const topLevel = (await runGit(['rev-parse', '--show-toplevel'])) || '-';
    const worktree = topLevel.split('/').filter(Boolean).pop() || topLevel;

    const branch =
      (await runGit(['branch', '--show-current'])) ||
      (await runGit(['rev-parse', '--short', 'HEAD'])) ||
      '(detached)';

    const upstream = await runGit([
      'rev-parse',
      '--abbrev-ref',
      '--symbolic-full-name',
      '@{upstream}',
    ]);

    if (!upstream) {
      return {
        inRepo: true,
        worktree,
        branch,
        tracking: '(no upstream)',
        ahead: 0,
        behind: 0,
      };
    }

    const countsRaw = await runGit(['rev-list', '--left-right', '--count', `${upstream}...HEAD`]);
    const { behind, ahead } = parseCount(countsRaw || '0 0');

    return {
      inRepo: true,
      worktree,
      branch,
      tracking: upstream,
      ahead,
      behind,
    };
  }

  function readAgentState(ctx: ExtensionContext): AgentSnapshot {
    const usage = ctx.getContextUsage();
    const modelContextWindow =
      (ctx.model as { contextWindow?: number } | undefined)?.contextWindow ?? 0;
    const modelId = ctx.model?.id || '(no model)';
    const thinking = pi.getThinkingLevel();

    return {
      tokens: usage?.tokens ?? null,
      contextWindow: usage?.contextWindow ?? modelContextWindow,
      modelText: `${modelId} • ${thinking}`,
    };
  }

  function buildFooterLines(width: number): string[] {
    const safeWidth = Math.max(1, width);
    const clampLines = (lines: string[]) =>
      lines.map((line) => truncateToWidth(line, safeWidth, '…', true));

    const gitPanel = buildGitPanel(gitState, safeWidth - 2);
    const agentPanel = buildAgentPanel(agentState, safeWidth - 2);

    const naturalCombined = gitPanel.width + visibleWidth(GAP) + agentPanel.width;
    if (naturalCombined <= safeWidth) {
      return clampLines(combineSideBySide(gitPanel.lines, gitPanel.width, agentPanel.lines));
    }

    const leftOuterTarget = Math.max(28, Math.floor((safeWidth - visibleWidth(GAP)) * 0.55));
    const rightOuterTarget = Math.max(28, safeWidth - visibleWidth(GAP) - leftOuterTarget);

    const gitCompact = buildGitPanel(gitState, Math.max(24, leftOuterTarget - 2));
    const agentCompact = buildAgentPanel(agentState, Math.max(24, rightOuterTarget - 2));

    const compactCombined = gitCompact.width + visibleWidth(GAP) + agentCompact.width;
    if (compactCombined <= safeWidth) {
      return clampLines(combineSideBySide(gitCompact.lines, gitCompact.width, agentCompact.lines));
    }

    const topWidth = maxVisibleWidth(gitPanel.lines);
    return clampLines(combineSideBySide(gitPanel.lines, topWidth, agentPanel.lines));
  }

  async function refreshGit(force = false) {
    if (!ctxRef || refreshingGit) return;

    const now = Date.now();
    if (!force && now - lastGitRefreshAt < REFRESH_MS) return;

    refreshingGit = true;
    try {
      gitState = await readGitInfo();
      lastGitRefreshAt = now;
    } finally {
      refreshingGit = false;
    }
  }

  async function tick(forceGit = false) {
    if (!ctxRef || ctxRef.mode !== 'tui') return;

    agentState = readAgentState(ctxRef);
    await refreshGit(forceGit);
    renderRequest?.();
  }

  function start() {
    if (!ctxRef || ctxRef.mode !== 'tui') return;
    if (timer) return;

    void tick(true);
    timer = setInterval(() => {
      void tick(false);
    }, TICK_MS);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    renderRequest = null;

    if (ctxRef?.mode === 'tui') {
      ctxRef.ui.setFooter(undefined);
    }
  }

  function installFooter(ctx: ExtensionContext) {
    ctxRef = ctx;
    if (!ctx.hasUI || ctx.mode !== 'tui') return;

    agentState = readAgentState(ctx);

    ctx.ui.setFooter((tui, _theme, footerData) => {
      const request = () => tui.requestRender();
      const unsubscribeBranch = footerData.onBranchChange(() => {
        void tick(true);
      });
      renderRequest = request;

      return {
        dispose() {
          unsubscribeBranch();
          if (renderRequest === request) renderRequest = null;
        },
        invalidate() {},
        render(width: number): string[] {
          return buildFooterLines(width);
        },
      };
    });

    start();
  }

  pi.on('session_start', async (_event, ctx) => {
    stop();
    installFooter(ctx);
  });

  pi.on('turn_end', async (_event, ctx) => {
    ctxRef = ctx;
    await tick(true);
  });

  pi.on('model_select', async (_event, ctx) => {
    ctxRef = ctx;
    agentState = readAgentState(ctx);
    renderRequest?.();
  });

  pi.on('thinking_level_select', async (_event, ctx) => {
    ctxRef = ctx;
    agentState = readAgentState(ctx);
    renderRequest?.();
  });

  pi.on('session_shutdown', async (_event, ctx) => {
    ctxRef = ctx;
    stop();
  });
}
