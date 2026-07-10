import { describe, expect, it } from 'vitest';
import { buildHarness } from './harness';
import type { HarnessSpec } from '../../content/types';

function decodeBase64Json(source: string, varName: string): unknown {
  const pattern = new RegExp(`${varName} = json\\.loads\\(base64\\.b64decode\\("([^"]+)"\\)`);
  const match = pattern.exec(source);
  if (!match?.[1]) throw new Error(`could not find base64 payload for ${varName}`);
  const binary = atob(match[1]);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

const spec: HarnessSpec = {
  mode: 'function',
  entryPoint: 'append',
  argTypes: ['linked_list', 'value'],
  resultType: 'linked_list',
  tests: [
    { id: 'basic', group: 'visible', args: [[1, 2], 3], expected: [1, 2, 3], comparator: 'deep' },
    { id: 'edge-empty', group: 'edge', args: [[], 1], expected: [1], comparator: 'deep', label: 'empty list' },
  ],
};

describe('buildHarness', () => {
  it('embeds the spec data recoverably via base64 JSON, not string interpolation', () => {
    const source = buildHarness(spec);
    expect(decodeBase64Json(source, '_ENTRY_POINT')).toBe('append');
    expect(decodeBase64Json(source, '_ARG_TYPES')).toEqual(['linked_list', 'value']);
    expect(decodeBase64Json(source, '_RESULT_TYPE')).toBe('linked_list');
    expect(decodeBase64Json(source, '_TESTS')).toEqual(spec.tests);
  });

  it('defines its own ListNode instead of relying on the user leaving one intact', () => {
    const source = buildHarness(spec);
    expect(source).toContain('class ListNode:');
    expect(source).toContain("getattr(node, 'val')");
    expect(source).toContain("getattr(node, 'next', None)");
  });

  it('executes user code into its own namespace and checks the entry point exists', () => {
    const source = buildHarness(spec);
    expect(source).toContain('exec(__user_code__, _ns)');
    expect(source).toContain('_fn = _ns.get(_ENTRY_POINT)');
    expect(source).toContain('not callable(_fn)');
  });

  it('wraps syntax errors, missing-entry-point, and per-test execution separately', () => {
    const source = buildHarness(spec);
    expect(source).toContain('except SyntaxError as e:');
    expect(source).toContain("_error_status = 'syntax_error'");
    expect(source).toContain("_error_status = 'runtime_error'");
    // per-test try/except so one crashing test can't hide the others
    expect(source).toContain("entry['passed'] = False");
  });

  it('prints exactly one sentinel-delimited JSON report line, with a fresh random sentinel per build', () => {
    const sourceA = buildHarness(spec);
    const sourceB = buildHarness(spec);

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
    const sentinelMatchA = /_SENTINEL = "([^"]+)"/.exec(sourceA);
    expect(sentinelMatchA?.[1]).toMatch(uuidPattern);

    const sentinelMatchB = /_SENTINEL = "([^"]+)"/.exec(sourceB);
    expect(sentinelMatchA?.[1]).not.toBe(sentinelMatchB?.[1]);

    expect(sourceA).toContain('print(_SENTINEL + json.dumps(_report) + _SENTINEL)');
  });

  it('only carries args/expected/got through for the visible group', () => {
    const source = buildHarness(spec);
    // the visible-only field assignment is guarded by this condition in both
    // the success and exception branches
    const visibleGuardCount = source.split("t['group'] == 'visible'").length - 1;
    expect(visibleGuardCount).toBe(2);
  });
});
