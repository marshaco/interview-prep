import { DexieAdapter } from '../storage/dexie/dexieAdapter';
import type { StorageAdapter } from '../storage/adapter';

// Single shared instance for the whole app — ui code only ever sees it
// through the StorageAdapter interface, never Dexie directly.
export const storageAdapter: StorageAdapter = new DexieAdapter();
