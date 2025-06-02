import { loadAppContainer } from './app'
import { envVariables } from './shared/lib/dotenv.lib'
import { logger } from './shared/lib/logger.lib'

void (async () => {
  const loadAppContainerResult = loadAppContainer(envVariables)
  if (loadAppContainerResult.succeed === false) {
    logger.error(
      'loading app container failed',
      loadAppContainerResult.normalizeCauseList(),
    )
    // eslint-disable-next-line no-restricted-globals
    process.exit(1)
  }
  await loadAppContainerResult.data.cradle.appManager.startApp()
})()
