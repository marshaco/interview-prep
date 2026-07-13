import type { HarnessSpec, OpStep } from '../../content/types';
import { SHARED_PRELUDE, toBase64Json } from './harness';

/**
 * Builds a Python harness that instantiates a class-mode question's
 * `entryPoint`, runs a demo script against it, and snapshots the instance's
 * state after every step — the trace-frame protocol from ARCHITECTURE §9.
 *
 * Deliberately separate from buildHarness (harness.ts): grading compares
 * results against expectations with a comparator; this only ever walks
 * `.head`/`.next` and records what it sees, regardless of correctness. A
 * broken solution still produces frames — whatever state it actually builds.
 *
 * Assumes the `linked_list` VisualizationBinding convention: the instance
 * exposes `.head`, and each node exposes `.val`/`.next`. Cycles are broken
 * the same way `_dump_list` already does for function-mode grading, via an
 * `id()`-based seen-set, so a circular structure snapshots as its distinct
 * values plus a trailing '<cycle>' marker instead of hanging.
 */
export function buildTraceHarness(spec: HarnessSpec, demoScript: OpStep[]): string {
  const sentinel = crypto.randomUUID();

  const entryPointB64 = toBase64Json(spec.entryPoint);
  const scriptB64 = toBase64Json(demoScript);

  return `${SHARED_PRELUDE}

_SENTINEL = ${JSON.stringify(sentinel)}
_ENTRY_POINT = json.loads(base64.b64decode(${JSON.stringify(entryPointB64)}).decode('utf-8'))
_SCRIPT = json.loads(base64.b64decode(${JSON.stringify(scriptB64)}).decode('utf-8'))

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


def _dump_instance_state(instance, max_nodes=10000):
    result = []
    seen = set()
    node = getattr(instance, 'head', None)
    count = 0
    while node is not None and count < max_nodes:
        if id(node) in seen:
            result.append('<cycle>')
            break
        seen.add(id(node))
        result.append(getattr(node, 'val', None))
        node = getattr(node, 'next', None)
        count += 1
    return result


_frames = []
if _error_status == 'ok':
    _cls = _ns.get(_ENTRY_POINT)
    if not callable(_cls):
        _error_status = 'runtime_error'
        _error_message = f"Class '{_ENTRY_POINT}' is not defined."
    else:
        try:
            _instance = _cls()
            for _i, _step in enumerate(_SCRIPT):
                _method = getattr(_instance, _step['op'])
                _method(*_step.get('args', []))
                _args_repr = ', '.join(repr(a) for a in _step.get('args', []))
                _frames.append({
                    'step': _i,
                    'label': f"{_step['op']}({_args_repr})",
                    'state': _dump_instance_state(_instance),
                })
        except Exception as e:
            _error_status = 'runtime_error'
            _error_message = f'{type(e).__name__}: {e}'

_report = {'status': _error_status, 'message': _error_message, 'results': [], 'frames': _frames}
print(_SENTINEL + json.dumps(_report) + _SENTINEL)
`;
}
