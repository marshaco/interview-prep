import { PyodideRunner } from '../engine/runner/pyodideRunner';
import type { PythonRunner } from '../engine/runner/types';

// Single shared instance for the whole app — ui code only ever sees it
// through the PythonRunner interface, never the concrete worker.
export const pythonRunner: PythonRunner = new PyodideRunner();
