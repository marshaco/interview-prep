import { describe, expect, it } from 'vitest';
import { buildTraceHarness } from './trace';
import type { HarnessSpec, OpStep } from '../../content/types';

function decodeBase64Json(source: string, varName: string): unknown {
  const pattern = new RegExp(`${varName} = json\\.loads\\(base64\\.b64decode\\("([^"]+)"\\)`);
  const match = pattern.exec(source);
  if (!match?.[1]) throw new Error(`could not find base64 payload for ${varName}`);
  const binary = atob(match[1]);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

const spec: HarnessSpec = {
  mode: 'class',
  entryPoint: 'LinkedList',
  tests: [],
};

const demoScript: OpStep[] = [
  { op: 'append', args: [1] },
  { op: 'append', args: [2] },
];

describe('buildTraceHarness', () => {
  it('embeds the entry point and demo script recoverably via base64 JSON', () => {
    const source = buildTraceHarness(spec, demoScript);
    expect(decodeBase64Json(source, '_ENTRY_POINT')).toBe('LinkedList');
    expect(decodeBase64Json(source, '_SCRIPT')).toEqual(demoScript);
  });

  it('walks .head/.next by duck typing rather than assuming a user Node class', () => {
    const source = buildTraceHarness(spec, demoScript);
    expect(source).toContain("getattr(instance, 'head', None)");
    expect(source).toContain("getattr(node, 'val', None)");
    expect(source).toContain("getattr(node, 'next', None)");
  });

  it('breaks cycles with an id()-based seen set instead of looping forever', () => {
    const source = buildTraceHarness(spec, demoScript);
    expect(source).toContain('if id(node) in seen:');
    expect(source).toContain("result.append('<cycle>')");
  });

  it('reports an empty results list and a frames list instead', () => {
    const source = buildTraceHarness(spec, demoScript);
    expect(source).toContain("'results': [], 'frames': _frames");
  });

  it('surfaces a syntax error the same way the grading harness does', () => {
    const source = buildTraceHarness(spec, demoScript);
    expect(source).toContain("_error_status = 'syntax_error'");
    expect(source).toContain("_error_status = 'runtime_error'");
  });
});
