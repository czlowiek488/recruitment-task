import { StatusCodes } from 'http-status-codes'
import type { Handler } from 'express'
import { logger } from '../lib/logger.lib'
import { Result } from '../lib/result.lib'
import type { Dependencies } from '../../app'

export const notFoundMiddleware =
  (dependencies: Dependencies): Handler =>
  (req, res) => {
    const message = `route not found: ${req.method} -> ${req.url}`
    logger.warning(message)
    dependencies.express.sendResponse(res)(
      StatusCodes.NOT_FOUND,
      new Result(
        false,
        'route not found',
        {
          method: req.method,
          url: req.url,
        },
        'ROUTE_ENDPOINT_NOT_FOUND_ERROR',
      ),
      {},
    )
  }
