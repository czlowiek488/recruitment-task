import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    silent: false,
    root: './',
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
    pool: 'threads',
    server: {
      sourcemap: 'inline',
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
})
