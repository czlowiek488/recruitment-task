import type { Dependencies } from '../../app'
import { Result } from './result.lib'
import type { FunctionResult } from './result.lib'
import { logger } from './logger.lib'
import { cockatielTimer } from './timer.lib'

export type HttpServer = {
  listen: () => FunctionResult<Promise<{}>, 'SERVER_LISTENING_ERROR'>
  close: () => FunctionResult<{}, 'SERVER_NOT_LISTENING_ERROR'>
  awaitUncompletedRequests: () => FunctionResult<
    Promise<{}>,
    'SERVER_AWAITING_UNCOMPLETED_REQUESTS_TIMEOUT_ERROR'
  >
}

export const httpServer = (dependencies: Dependencies): HttpServer => {
  const state = {
    server: dependencies.express.createServer(),
    listening: false,
    connectionsAmount: 0,
  }
  return {
    close: () => {
      if (state.listening === false) {
        return new Result(
          false,
          'server unexpectedly is not listening',
          {},
          'SERVER_NOT_LISTENING_ERROR',
        )
      }
      state.server.close()
      state.listening = false
      return new Result(true, 'server closed', {})
    },
    awaitUncompletedRequests: async () => {
      const result = await cockatielTimer({
        maxDuration: 30_000,
        delay: 250,
        check: () => {
          const isZeroed = state.connectionsAmount === 0
          if (isZeroed) {
            return true
          }
          return false
        },
      })

      if (result.succeed === true) {
        return new Result(
          true,
          'server awaiting uncompleted requests finished',
          {},
        )
      }
      return new Result(
        false,
        'server awaiting uncompleted requests timeout',
        {},
        'SERVER_AWAITING_UNCOMPLETED_REQUESTS_TIMEOUT_ERROR',
      )
    },
    listen: async () => {
      try {
        await new Promise<void>((resolve) => {
          state.server.listen(
            {
              port: dependencies.config.APP_PORT,
              hostname: dependencies.config.APP_HOST,
            },
            resolve,
          )
        })
        state.listening = true
        logger.info(
          `${dependencies.config.APP_NAME} server is listening at http://${dependencies.config.APP_HOST}:${dependencies.config.APP_PORT}`,
        )
        return new Result(true, 'server listening starting succeed', {})
      } catch (error) {
        return new Result(
          false,
          'server listening started failed',
          {},
          'SERVER_LISTENING_ERROR',
          error,
        )
      }
    },
  }
}
