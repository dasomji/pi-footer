import { FAST_STATUS_KEY, hasFastModeStatus, withFastModeStatus } from '../extensions/fast-mode';
import { buildAgentPanel } from '../extensions/info';

type FakeFooterData = {
  getExtensionStatuses(): ReadonlyMap<string, string>;
};

function footerData(entries: Array<[string, string]>): FakeFooterData {
  const statuses = new Map(entries);
  return {
    getExtensionStatuses: () => statuses,
  };
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const baseSnapshot = {
  tokens: 12345,
  contextWindow: 200000,
  modelText: 'gpt-5.5 • xhigh',
};

const inactiveFooter = footerData([]);
assert(!hasFastModeStatus(inactiveFooter), 'Fast Mode should be inactive without pi-fast-mode status');
const inactiveSnapshot = withFastModeStatus(baseSnapshot, inactiveFooter);
assert(
  inactiveSnapshot.modelText === baseSnapshot.modelText,
  'Model text should not change when Fast Mode status is absent',
);
assert(
  !buildAgentPanel(inactiveSnapshot, 80).lines.join('\n').includes('Fast'),
  'Rendered AGENT panel should not include Fast when status is absent',
);

const activeFooter = footerData([[FAST_STATUS_KEY, '● Fast']]);
assert(hasFastModeStatus(activeFooter), 'Fast Mode should be active when pi-fast-mode status exists');
const activeSnapshot = withFastModeStatus(baseSnapshot, activeFooter);
assert(
  activeSnapshot.modelText === 'gpt-5.5 • xhigh • Fast',
  'Model text should include Fast when pi-fast-mode status exists',
);
assert(
  buildAgentPanel(activeSnapshot, 80).lines.join('\n').includes('Fast'),
  'Rendered AGENT panel should visibly include Fast when pi-fast-mode status exists',
);

const alreadyTagged = { ...baseSnapshot, modelText: 'gpt-5.5 • xhigh • Fast' };
assert(
  withFastModeStatus(alreadyTagged, activeFooter).modelText === alreadyTagged.modelText,
  'Fast Mode marker should not be duplicated',
);

console.log('Fast Mode footer status verification passed');
