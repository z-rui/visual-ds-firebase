import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Look for test files in the 'src' directory, with a .test.ts or .test.tsx extension
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only measure coverage for our actual data structure files
      include: ['src/lib/ds/**/*.ts'],
      // Exclude test files, type definitions, and the generic binary-tree base class from coverage
      exclude: [
        'src/**/*.test.ts', 
        'src/types/**/*.ts',
        'src/lib/ds/binary-tree.ts'
      ],
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
