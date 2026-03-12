import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './apps/web/vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['apps/web/src/**/*.test.ts', 'packages/shared/src/**/*.test.ts'],
    },
  }),
);
