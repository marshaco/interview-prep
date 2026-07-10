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

const classSpec: HarnessSpec = {
  mode: 'class',
  entryPoint: 'LinkedList',
  tests: [
    {
      id: 'basic',
      group: 'visible',
      comparator: 'deep',
      script: [
        { op: 'append', args: [1] },
        { op: 'append', args: [2] },
        { op: 'to_list', expect: [1, 2] },
      ],
    },
  ],
};

describe('buildHarness (class mode)', () => {
  it('instantiates the class fresh per test case rather than reusing one instance', () => {
    const source = buildHarness(classSpec);
    expect(source).toContain('_cls = _ns.get(_ENTRY_POINT)');
    expect(source).toContain('instance = _cls()');
  });

  it('drives the instance purely through getattr method calls from the script', () => {
    const source = buildHarness(classSpec);
    expect(source).toContain("method = getattr(instance, step['op'])");
    expect(source).toContain("result = method(*step.get('args', []))");
  });

  it('stops at the first diverging step and records its index, not later steps', () => {
    const source = buildHarness(classSpec);
    expect(source).toContain('failed_step_index = i');
    expect(source).toContain('break');
  });

  it('checks the entry point is a callable (class), with a class-specific message', () => {
    const source = buildHarness(classSpec);
    expect(source).toContain("_error_message = f\"Class '{_ENTRY_POINT}' is not defined.\"");
  });

  it('only carries the script through for the visible group, keyed off the same guard as function mode', () => {
    const source = buildHarness(classSpec);
    const visibleGuardCount = source.split("t['group'] == 'visible'").length - 1;
    expect(visibleGuardCount).toBe(1);
  });
});

describe('buildHarness (checker comparator)', () => {
  const specWithChecker: HarnessSpec = {
    mode: 'function',
    entryPoint: 'is_even',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'checker-case',
        group: 'visible',
        args: [4],
        expected: null,
        comparator: 'checker',
        checker: 'return got is True',
      },
    ],
  };

  it('builds a per-test checker function from the embedded checker body rather than a shared one', () => {
    const source = buildHarness(specWithChecker);
    expect(source).toContain("if comparator == 'checker':");
    expect(source).toContain("exec('def _fn(got, expected):\\n' + textwrap.indent(checker_body, '    ')");
    // the checker body itself travels inside the base64 _TESTS payload, not string-interpolated
    expect(source).not.toContain('return got is True');
  });
});
