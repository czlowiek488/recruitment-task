import type { AwilixContainer } from 'awilix'
import { loadAppContainer, routeList } from './app'
import type { Dependencies } from './app'
import { Result } from './shared/lib/result.lib'
import type { FunctionResult } from './shared/lib/result.lib'
import { setEnvVariables } from './shared/lib/dotenv.lib'
import { logger } from './shared/lib/logger.lib'
import type { Config } from './app.config'

export type AppManager = {
  closeApp: () => FunctionResult<Promise<{}>, 'APP_CLOSING_ERROR'>
  startApp: () => FunctionResult<Promise<{}>, 'APP_STARTING_ERROR'>
  reloadApp: <TDependencies extends Dependencies>(
    env: Config,
    container: AwilixContainer<TDependencies>,
  ) => FunctionResult<
    Promise<AwilixContainer<TDependencies>>,
    'APP_RELOADING_ERROR'
  >
}
export const appManager = (dependencies: Dependencies): AppManager => {
  return {
    reloadApp: async (env, container) => {
      try {
        logger.info(`manager app setting env variables...`, env, {
          pretty: true,
        })
        setEnvVariables(env)
        logger.info(`manager app env variables set`)
        const closeAppResult = await dependencies.appManager.closeApp()
        if (closeAppResult.succeed === false) {
          return new Result(
            false,
            'manager app reloading failed',
            {},
            'APP_RELOADING_ERROR',
            closeAppResult,
          )
        }
        const loadAppContainerResult = loadAppContainer(env as any, container)
        if (loadAppContainerResult.succeed === false) {
          return new Result(
            false,
            'manager app reloading failed',
            {},
            'APP_RELOADING_ERROR',
            loadAppContainerResult,
          )
        }
        const startAppResult = await dependencies.appManager.startApp()
        if (startAppResult.succeed === false) {
          return new Result(
            false,
            'manager app reloading failed',
            {},
            'APP_RELOADING_ERROR',
            startAppResult,
          )
        }
        return new Result(
          true,
          'manager app reloading succeed',
          loadAppContainerResult.data,
        )
      } catch (error) {
        return new Result(
          false,
          'manager app reloading failed',
          {},
          'APP_RELOADING_ERROR',
          error,
        )
      }
    },
    startApp: async () => {
      try {
        const connectDatabaseResult =
          await dependencies.dbManager.connectDatabases()
        if (connectDatabaseResult.succeed === false) {
          return new Result(
            false,
            'manager app starting failed',
            {},
            'APP_STARTING_ERROR',
            connectDatabaseResult,
          )
        }
        dependencies.express.initializeRoutes(Object.keys(routeList))
        await dependencies.httpServer.listen()
        return new Result(true, 'manager app starting succeed', {})
      } catch (error) {
        return new Result(
          false,
          'manager app starting failed',
          {},
          'APP_STARTING_ERROR',
          error,
        )
      }
    },
    closeApp: async () => {
      try {
        const result = await dependencies.dbManager.disconnectDatabases()
        if (result.succeed === false) {
          return new Result(
            false,
            'manager app closing failed',
            {},
            'APP_CLOSING_ERROR',
            result,
          )
        }
        const serverCloseResult = dependencies.httpServer.close()
        await dependencies.httpServer.awaitUncompletedRequests()
        if (serverCloseResult.succeed === false) {
          return new Result(
            false,
            'manager app closing failed',
            {},
            'APP_CLOSING_ERROR',
            serverCloseResult,
          )
        }
        return new Result(true, 'manager app closing succeed', {})
      } catch (error) {
        return new Result(
          false,
          'manager app closing failed',
          {},
          'APP_CLOSING_ERROR',
          error,
        )
      }
    },
  }
}
