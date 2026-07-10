import '@testing-library/jest-dom/vitest';
// jsdom doesn't implement IndexedDB; Dexie needs a real (fake) one to run under Vitest.
import 'fake-indexeddb/auto';
