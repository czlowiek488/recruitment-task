import type { Handler } from 'express-serve-static-core'
import { asyncLocalStorage } from '../lib/async-local-storage.lib'
import { v4 } from 'uuid'
import { logger, LoggingFileNames } from '../lib/logger.lib'

export const authorizationMiddleware = (): Handler => (req, res, next) => {
  asyncLocalStorage.run({ executionId: v4() }, () => {
    logger.debug(
      'authorized',
      {},
      { file: LoggingFileNames.MIDDLEWARE_AUTHORIZATION },
    )
    next()
  })
}
