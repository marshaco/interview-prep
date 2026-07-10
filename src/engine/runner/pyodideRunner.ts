import type { PythonRunner, RunRequest, RunResult, RunStatus, WorkerResponse } from './types';

type ReadyState = 'booting' | 'ready' | 'error';

interface PendingRun {
  runId: string;
  resolve: (result: RunResult) => void;
  timer: ReturnType<typeof setTimeout>;
  startedAt: number;
}

/**
 * One Pyodide-backed worker plus its own boot lifecycle. `onExecResult` is
 * wired externally and only ever fires for the slot currently acting as
 * "hot" — see PyodideRunner.recoverWithStatus, which rewires it on promotion.
 */
class WorkerSlot {
  worker: Worker;
  private state: ReadyState = 'booting';
  private waiters: Array<() => void> = [];
  onExecResult: ((message: Extract<WorkerResponse, { type: 'exec-result' }>) => void) | null = null;

  constructor() {
    this.worker = this.boot();
  }

  private boot(): Worker {
    const worker = new Worker(new URL('../../workers/pyodide.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleMessage(event.data);
    };
    worker.onerror = () => {
      this.state = 'error';
    };
    this.state = 'booting';
    worker.postMessage({ type: 'init' });
    return worker;
  }

  private handleMessage(message: WorkerResponse): void {
    if (message.type === 'ready') {
      this.state = 'ready';
      this.waiters.splice(0).forEach((resolve) => {
        resolve();
      });
      return;
    }
    if (message.type === 'init-error') {
      this.state = 'error';
      return;
    }
    if (message.type === 'exec-result') {
      this.onExecResult?.(message);
    }
  }

  get isReady(): boolean {
    return this.state === 'ready';
  }

  async waitUntilReady(): Promise<void> {
    if (this.state === 'ready') return;
    if (this.state === 'error') {
      this.worker = this.boot();
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
  }

  terminate(): void {
    this.worker.terminate();
  }
}

/**
 * PythonRunner backed by a hot worker plus one warm spare, per
 * ARCHITECTURE §6.2. Timeout and cancellation both promote the spare (already
 * loaded) to hot immediately and boot a fresh spare in the background, so
 * the *next* run doesn't pay Pyodide's ~2-4s boot cost — only the terminated
 * run itself is lost. If the spare isn't ready yet (e.g. back-to-back
 * timeouts faster than a spare can boot), this falls back to a cold boot,
 * same as if there were no spare at all.
 */
export class PyodideRunner implements PythonRunner {
  private hot: WorkerSlot;
  private spare: WorkerSlot;
  private pending: PendingRun | null = null;

  constructor() {
    this.hot = new WorkerSlot();
    this.wireHot(this.hot);
    this.spare = new WorkerSlot();
  }

  private wireHot(slot: WorkerSlot): void {
    slot.onExecResult = (message) => {
      if (this.pending?.runId !== message.runId) return;
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
    };
  }

  async warmup(): Promise<void> {
    await this.hot.waitUntilReady();
  }

  async run(request: RunRequest): Promise<RunResult> {
    await this.warmup();
    return new Promise<RunResult>((resolve) => {
      const startedAt = performance.now();
      const timer = setTimeout(() => {
        this.recoverWithStatus(request.runId, 'timeout');
      }, request.timeoutMs);
      this.pending = { runId: request.runId, resolve, timer, startedAt };
      this.hot.worker.postMessage({
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

    this.hot.terminate();

    if (this.spare.isReady) {
      this.hot = this.spare;
      this.wireHot(this.hot);
    } else {
      this.spare.terminate();
      this.hot = new WorkerSlot();
      this.wireHot(this.hot);
    }
    this.spare = new WorkerSlot();

    resolve({
      runId,
      status,
      stdout: '',
      stderr: '',
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}
