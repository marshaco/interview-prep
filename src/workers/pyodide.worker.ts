/// <reference lib="webworker" />
import type { HarnessReport } from '../engine/grading/types';
import type { WorkerRequest, WorkerResponse } from '../engine/runner/types';

declare const self: DedicatedWorkerGlobalScope;

// Pinned exact version — see PyodideRunner class docs for why dynamic
// import() of the .mjs build (rather than importScripts) is required here:
// Vite workers are ES modules, and importScripts is unavailable in that context.
const PYODIDE_VERSION = '0.28.0';
const PYODIDE_CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Minimal shape of what we actually call on the Pyodide instance.
interface PyodideInstance {
  globals: { set(name: string, value: unknown): void };
  setStdout(options: { batched: (text: string) => void }): void;
  setStderr(options: { batched: (text: string) => void }): void;
  runPythonAsync(code: string): Promise<unknown>;
}

let pyodidePromise: Promise<PyodideInstance> | null = null;

async function loadPyodideInstance(): Promise<PyodideInstance> {
  const mod = (await import(/* @vite-ignore */ `${PYODIDE_CDN_BASE}pyodide.mjs`)) as {
    loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
  };
  return mod.loadPyodide({ indexURL: PYODIDE_CDN_BASE });
}

function post(message: WorkerResponse): void {
  self.postMessage(message);
}

const SENTINEL_PATTERN = /([0-9a-fA-F-]{36})([\s\S]*)\1/;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleMessage(event.data);
};

async function handleMessage(message: WorkerRequest): Promise<void> {
  if (message.type === 'init') {
    pyodidePromise = loadPyodideInstance();
    try {
      await pyodidePromise;
      post({ type: 'ready' });
    } catch (err) {
      post({ type: 'init-error', message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (message.type === 'exec') {
    const startedAt = performance.now();
    try {
      pyodidePromise ??= loadPyodideInstance();
      const pyodide = await pyodidePromise;

      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];
      pyodide.setStdout({ batched: (text) => stdoutChunks.push(text) });
      pyodide.setStderr({ batched: (text) => stderrChunks.push(text) });
      pyodide.globals.set('__user_code__', message.userCode);

      await pyodide.runPythonAsync(message.harness);

      const rawStdout = stdoutChunks.join('\n');
      const match = SENTINEL_PATTERN.exec(rawStdout);
      const durationMs = Math.round(performance.now() - startedAt);

      if (!match) {
        post({
          type: 'exec-result',
          runId: message.runId,
          status: 'runtime_error',
          stdout: rawStdout,
          stderr: stderrChunks.join('\n') || 'Harness did not produce a report.',
          durationMs,
        });
        return;
      }

      const harnessReport = JSON.parse(match[2] ?? '') as HarnessReport;
      const cleanStdout = (rawStdout.slice(0, match.index) + rawStdout.slice(match.index + match[0].length)).trim();

      if (harnessReport.status === 'ok') {
        post({
          type: 'exec-result',
          runId: message.runId,
          status: 'ok',
          stdout: cleanStdout,
          stderr: stderrChunks.join('\n'),
          report: { results: harnessReport.results, frames: harnessReport.frames },
          durationMs,
        });
      } else {
        post({
          type: 'exec-result',
          runId: message.runId,
          status: harnessReport.status,
          stdout: cleanStdout,
          stderr: harnessReport.message ?? '',
          durationMs,
        });
      }
    } catch (err) {
      post({
        type: 'exec-result',
        runId: message.runId,
        status: 'runtime_error',
        stdout: '',
        stderr: err instanceof Error ? err.message : String(err),
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  }
}
