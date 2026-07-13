import type { HarnessSpec } from '../../content/types';
import {
  COMPARATOR_DISPATCH_PY,
  DEEP_COMPARATOR_PY,
  FLOAT_CLOSE_COMPARATOR_PY,
  UNORDERED_COMPARATOR_PY,
} from './comparators';

/**
 * UTF-8-safe base64 encoding, used to embed JSON payloads into the
 * generated Python source without any manual quote/backslash escaping —
 * the classic source of string-templating injection bugs. Works in both
 * the browser/worker (harness is built on the main thread) and Node
 * (harness.test.ts / canonicalSolutions.test.ts run under Vitest).
 */
export function toBase64Json(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

/**
 * Exported for reuse by trace.ts: the trace harness needs the same
 * `__user_code__` exec/error-handling scaffolding and duck-typed node
 * helpers, just a different execution section (script + snapshot instead of
 * script + comparator).
 */
export const SHARED_PRELUDE = `import base64, json, math, random, sys, textwrap

random.seed(0)
sys.setrecursionlimit(3000)


class ListNode:
    __slots__ = ('val', 'next')

    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def _build_list(values):
    head = None
    tail = None
    for v in values:
        node = ListNode(v)
        if head is None:
            head = node
        else:
            tail.next = node
        tail = node
    return head


def _build_list_with_cycle(spec):
    values = spec['values']
    cycle_pos = spec.get('cyclePos')
    nodes = [ListNode(v) for v in values]
    for i in range(len(nodes) - 1):
        nodes[i].next = nodes[i + 1]
    if cycle_pos is not None and nodes:
        nodes[-1].next = nodes[cycle_pos]
    return nodes[0] if nodes else None


def _dump_list(node, max_nodes=10000):
    result = []
    seen = set()
    count = 0
    while node is not None and count < max_nodes:
        if id(node) in seen:
            result.append('<cycle>')
            break
        seen.add(id(node))
        result.append(getattr(node, 'val'))
        node = getattr(node, 'next', None)
        count += 1
    return result


def _from_json(value, io_type):
    if io_type == 'linked_list':
        return _build_list(value)
    if io_type == 'linked_list_with_cycle':
        return _build_list_with_cycle(value)
    return value


def _to_comparable(value, io_type):
    if io_type == 'linked_list':
        return _dump_list(value)
    return value


${DEEP_COMPARATOR_PY}


${UNORDERED_COMPARATOR_PY}


${FLOAT_CLOSE_COMPARATOR_PY}


${COMPARATOR_DISPATCH_PY}


def _compare(comparator, got, expected, checker_body):
    if comparator == 'checker':
        _checker_ns = {}
        exec('def _fn(got, expected):\\n' + textwrap.indent(checker_body, '    '), _checker_ns)
        return bool(_checker_ns['_fn'](got, expected))
    return bool(_COMPARATORS[comparator](got, expected))`;

const FUNCTION_MODE_EXECUTION_PY = `_results = []
if _error_status == 'ok':
    _fn = _ns.get(_ENTRY_POINT)
    if not callable(_fn):
        _error_status = 'runtime_error'
        _error_message = f"Function '{_ENTRY_POINT}' is not defined."
    else:
        for t in _TESTS:
            entry = {'id': t['id'], 'group': t['group']}
            if t.get('label'):
                entry['label'] = t['label']
            try:
                call_args = [_from_json(a, _ARG_TYPES[i]) for i, a in enumerate(t['args'])]
                got_raw = _fn(*call_args)
                got = _to_comparable(got_raw, _RESULT_TYPE)
                entry['passed'] = _compare(t['comparator'], got, t['expected'], t.get('checker'))
                if t['group'] == 'visible':
                    entry['args'] = t['args']
                    entry['expected'] = t['expected']
                    entry['got'] = got
            except Exception as e:
                entry['passed'] = False
                entry['error'] = f'{type(e).__name__}: {e}'
                if t['group'] == 'visible':
                    entry['args'] = t['args']
            _results.append(entry)`;

const CLASS_MODE_EXECUTION_PY = `_results = []
if _error_status == 'ok':
    _cls = _ns.get(_ENTRY_POINT)
    if not callable(_cls):
        _error_status = 'runtime_error'
        _error_message = f"Class '{_ENTRY_POINT}' is not defined."
    else:
        for t in _TESTS:
            entry = {'id': t['id'], 'group': t['group']}
            if t.get('label'):
                entry['label'] = t['label']

            passed = True
            error_message = None
            failed_step_index = None
            failed_expected = None
            failed_got = None
            i = -1
            try:
                instance = _cls()
                for i, step in enumerate(t['script']):
                    method = getattr(instance, step['op'])
                    result = method(*step.get('args', []))
                    if 'expect' in step:
                        if not _compare(t['comparator'], result, step['expect'], t.get('checker')):
                            passed = False
                            failed_step_index = i
                            failed_expected = step['expect']
                            failed_got = result
                            break
            except Exception as e:
                passed = False
                error_message = f'{type(e).__name__}: {e}'
                failed_step_index = i

            entry['passed'] = passed
            if error_message is not None:
                entry['error'] = error_message
            if t['group'] == 'visible':
                entry['script'] = t['script']
                if not passed:
                    if failed_step_index is not None:
                        entry['failedStepIndex'] = failed_step_index
                    if error_message is None:
                        entry['expected'] = failed_expected
                        entry['got'] = failed_got
            _results.append(entry)`;

/**
 * Builds the Python harness source for a HarnessSpec, in either function or
 * class mode.
 *
 * The harness owns its own ListNode class (function mode) and only ever
 * reads results back via duck typing (getattr for .val/.next) — it never
 * assumes the user's code left ListNode intact, so a renamed or broken user
 * ListNode class can't break grading of inputs the harness itself builds.
 * In class mode, the harness instantiates the user's own class fresh per
 * test case and drives it purely through its public methods.
 *
 * `__user_code__` is expected to be set as a Python global (a real string)
 * by the runner before this source runs — see pyodideRunner.ts. Keeping it
 * out of this template avoids ever needing to embed arbitrary user source
 * text inside a Python string literal.
 */
export function buildHarness(spec: HarnessSpec): string {
  const sentinel = crypto.randomUUID();

  const entryPointB64 = toBase64Json(spec.entryPoint);
  const argTypesB64 = toBase64Json(spec.argTypes ?? null);
  const resultTypeB64 = toBase64Json(spec.resultType ?? null);
  const testsB64 = toBase64Json(spec.tests);

  const executionSection = spec.mode === 'class' ? CLASS_MODE_EXECUTION_PY : FUNCTION_MODE_EXECUTION_PY;

  return `${SHARED_PRELUDE}

_SENTINEL = ${JSON.stringify(sentinel)}
_ENTRY_POINT = json.loads(base64.b64decode(${JSON.stringify(entryPointB64)}).decode('utf-8'))
_ARG_TYPES = json.loads(base64.b64decode(${JSON.stringify(argTypesB64)}).decode('utf-8'))
_RESULT_TYPE = json.loads(base64.b64decode(${JSON.stringify(resultTypeB64)}).decode('utf-8'))
_TESTS = json.loads(base64.b64decode(${JSON.stringify(testsB64)}).decode('utf-8'))

_ns = {}
_error_status = 'ok'
_error_message = None
try:
    exec(__user_code__, _ns)
except SyntaxError as e:
    _error_status = 'syntax_error'
    _error_message = str(e)
except Exception as e:
    _error_status = 'runtime_error'
    _error_message = f'{type(e).__name__}: {e}'

${executionSection}

_report = {'status': _error_status, 'message': _error_message, 'results': _results}
print(_SENTINEL + json.dumps(_report) + _SENTINEL)
`;
}
