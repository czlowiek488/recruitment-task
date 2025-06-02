import { loadAppContainer } from './app'
import { envVariables } from './shared/lib/dotenv.lib'
import { logger } from './shared/lib/logger.lib'
import { Result } from './shared/lib/result.lib'

const runMigration = async () => {
  const loadAppContainerResult = loadAppContainer(envVariables)
  if (loadAppContainerResult.succeed === false) {
    return loadAppContainerResult
  }
  const connectDatabasesResult =
    await loadAppContainerResult.data.cradle.dbManager.connectDatabases()
  if (connectDatabasesResult.succeed === false) {
    return connectDatabasesResult
  }
  const runMigrationsResult =
    await loadAppContainerResult.data.cradle.dbManager.runMigrations()
  if (runMigrationsResult.succeed === false) {
    return runMigrationsResult
  }
  const disconnectDatabasesResult =
    await loadAppContainerResult.data.cradle.dbManager.disconnectDatabases()
  if (disconnectDatabasesResult.succeed === false) {
    return disconnectDatabasesResult
  }
  return new Result(true, 'db migration succeed', {})
}

;(async (): Promise<void> => {
  const runMigrationResult = await runMigration()
  if (runMigrationResult.succeed === false) {
    logger.error('migration failed', runMigrationResult.normalizeCauseList())
    throw runMigrationResult.destroyToThrow()
  }
  logger.debug('migration successfully executed')
  // eslint-disable-next-line no-restricted-globals
  process.exit(0)
})()
