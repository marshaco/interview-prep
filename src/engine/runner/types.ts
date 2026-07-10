import type { TestReport } from '../grading/types';

export type RunStatus = 'ok' | 'timeout' | 'runtime_error' | 'syntax_error' | 'cancelled';

export interface RunRequest {
  runId: string;
  userCode: string;
  harness: string; // generated Python (engine/grading/harness.ts)
  timeoutMs: number; // wall-clock, enforced from the main thread
}

export interface RunResult {
  runId: string;
  status: RunStatus;
  stdout: string;
  stderr: string;
  report?: TestReport; // present only when status === 'ok'
  durationMs: number;
}

export interface PythonRunner {
  warmup(): Promise<void>;
  run(request: RunRequest): Promise<RunResult>;
  cancel(runId: string): Promise<void>;
}

// --- Worker message protocol (the raw postMessage contract) ---

export type WorkerRequest = { type: 'init' } | { type: 'exec'; runId: string; userCode: string; harness: string };

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'init-error'; message: string }
  | {
      type: 'exec-result';
      runId: string;
      status: RunStatus;
      stdout: string;
      stderr: string;
      report?: TestReport;
      durationMs: number;
    };
