import type { PythonRunner, RunRequest, RunResult, RunStatus, WorkerResponse } from './types';

type ReadyState = 'booting' | 'ready' | 'error';

interface PendingRun {
  runId: string;
  resolve: (result: RunResult) => void;
  timer: ReturnType<typeof setTimeout>;
  startedAt: number;
}

/**
 * Single-worker PythonRunner. Timeout and cancellation both use the same
 * blunt recovery path: terminate the worker and spawn a fresh one. This is
 * deliberately crude — see ARCHITECTURE §6.2 — rather than relying on
 * SharedArrayBuffer interrupts, which need COOP/COEP headers this app's
 * static hosting targets can't guarantee. A warm-spare worker (so recovery
 * doesn't pay the ~2-4s Pyodide boot cost) arrives in Phase 1.
 */
export class PyodideRunner implements PythonRunner {
  private worker: Worker;
  private readyState: ReadyState = 'booting';
  private readyWaiters: Array<() => void> = [];
  private pending: PendingRun | null = null;

  constructor() {
    this.worker = this.spawnWorker();
  }

  private spawnWorker(): Worker {
    const worker = new Worker(new URL('../../workers/pyodide.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleMessage(event.data);
    };
    worker.onerror = () => {
      this.readyState = 'error';
    };
    this.readyState = 'booting';
    worker.postMessage({ type: 'init' });
    return worker;
  }

  private handleMessage(message: WorkerResponse): void {
    if (message.type === 'ready') {
      this.readyState = 'ready';
      this.readyWaiters.splice(0).forEach((resolve) => {
        resolve();
      });
      return;
    }

    if (message.type === 'init-error') {
      this.readyState = 'error';
      return;
    }

    if (message.type === 'exec-result' && this.pending?.runId === message.runId) {
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      pending.resolve({
        runId: message.runId,
        status: message.status,
        stdout: message.stdout,
        stderr: message.stderr,
        report: message.report,
        durationMs: message.durationMs,
      });
    }
  }

  async warmup(): Promise<void> {
    if (this.readyState === 'ready') return;
    if (this.readyState === 'error') {
      this.worker = this.spawnWorker();
    }
    await new Promise<void>((resolve) => this.readyWaiters.push(resolve));
  }

  async run(request: RunRequest): Promise<RunResult> {
    await this.warmup();
    return new Promise<RunResult>((resolve) => {
      const startedAt = performance.now();
      const timer = setTimeout(() => {
        this.recoverWithStatus(request.runId, 'timeout');
      }, request.timeoutMs);
      this.pending = { runId: request.runId, resolve, timer, startedAt };
      this.worker.postMessage({
        type: 'exec',
        runId: request.runId,
        userCode: request.userCode,
        harness: request.harness,
      });
    });
  }

  cancel(runId: string): Promise<void> {
    if (this.pending?.runId === runId) {
      this.recoverWithStatus(runId, 'cancelled');
    }
    return Promise.resolve();
  }

  private recoverWithStatus(runId: string, status: RunStatus): void {
    if (this.pending?.runId !== runId) return;
    const { resolve, startedAt, timer } = this.pending;
    clearTimeout(timer);
    this.pending = null;

    this.worker.terminate();
    this.worker = this.spawnWorker();

    resolve({
      runId,
      status,
      stdout: '',
      stderr: '',
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}
