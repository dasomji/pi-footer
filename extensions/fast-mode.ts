import type { ReadonlyFooterDataProvider } from '@earendil-works/pi-coding-agent';
import type { AgentSnapshot } from './info';

export const FAST_STATUS_KEY = 'pi-fast-mode';

type FastStatusFooterData = Pick<ReadonlyFooterDataProvider, 'getExtensionStatuses'>;

export function hasFastModeStatus(
  footerData: FastStatusFooterData | null | undefined,
): boolean {
  return footerData?.getExtensionStatuses().has(FAST_STATUS_KEY) ?? false;
}

export function withFastModeStatus(
  snapshot: AgentSnapshot,
  footerData: FastStatusFooterData | null | undefined,
): AgentSnapshot {
  if (!hasFastModeStatus(footerData)) return snapshot;
  if (/\bFast\b/.test(snapshot.modelText)) return snapshot;
  return { ...snapshot, modelText: `${snapshot.modelText} • Fast` };
}
