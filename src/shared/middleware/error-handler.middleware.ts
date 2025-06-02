import type { ErrorRequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { stringifyError } from '../parser/stringify-error'
import { logger, LoggingFileNames } from '../lib/logger.lib'
import type { Dependencies } from '../../app'
import { Result } from '../lib/result.lib'

export const errorHandlerMiddleware =
  (dependencies: Dependencies): ErrorRequestHandler =>
  (error, req, res, _next) => {
    if (error instanceof Result) {
      logger.error(
        'UNHANDLED APP ERROR',
        { causeNameList: error.getCauseNameList() },
        {
          file: LoggingFileNames.MIDDLEWARE_ERROR_HANDLER,
        },
      )
      dependencies.express.sendResponse(res)(
        StatusCodes.INTERNAL_SERVER_ERROR,
        new Result(
          false,
          'route request failed with unexpected error',
          {},
          'ROUTE_REQUEST_UNEXPECTED_ERROR',
          error,
        ),
        {},
      )
    } else {
      logger.crit(
        'UNHANDLED SERVER ERROR',
        {
          error: stringifyError(error),
        },
        { file: LoggingFileNames.MIDDLEWARE_ERROR_HANDLER },
      )
      dependencies.express.sendResponse(res)(
        StatusCodes.INTERNAL_SERVER_ERROR,
        new Result(
          false,
          'route request error handler failed',
          {},
          'ROUTE_REQUEST_UNEXPECTED_ERROR',
          error,
        ),
        {},
      )
    }
  }
