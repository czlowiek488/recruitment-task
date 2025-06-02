import { mergeConfig } from 'vitest/config'
import vitestConfig from './vitest.config'
export default mergeConfig(vitestConfig, {
  test: {
    setupFiles: ['./test/setup.ts'],
  },
})
