import '@testing-library/jest-dom/vitest';

// jsdom implements neither, and both are used by the upload queue and menus.
if (!('randomUUID' in crypto)) {
  Object.defineProperty(crypto, 'randomUUID', {
    value: () => `test-${Math.random().toString(16).slice(2)}`,
  });
}

if (!globalThis.URL.createObjectURL) {
  globalThis.URL.createObjectURL = () => 'blob:test';
  globalThis.URL.revokeObjectURL = () => {};
}
