import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    pool: 'forks',
  },
})
