import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./server/tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Property-based testing configuration
    // fast-check will run minimum 100 iterations per property test
    env: {
      FAST_CHECK_MIN_ITERATIONS: '100'
    }
  }
});
