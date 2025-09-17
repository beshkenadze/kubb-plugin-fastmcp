import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/test/generated/**',
      '**/kubb.config*.ts',
    ],
    // Concurrency settings
    pool: 'threads',
    maxConcurrency: 4,
    minWorkers: 2,
    maxWorkers: 4,
    // Timeouts
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})