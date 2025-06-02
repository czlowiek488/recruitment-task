import { StatusCodes } from 'http-status-codes'
import { zod } from '../../shared/lib/zod.lib'
import { createRoute } from '../../shared/structure/route.structure'
import { Result } from '../../shared/lib/result.lib'
import { DateTime } from 'luxon'
import { DatabaseName } from '../../shared/enum/database-name.enum'
import { RouteName } from '../../shared/enum/route-name.enum'

export const healthCheckGetRoute = createRoute(
  zod.object({
    databaseConnectionStatus: zod
      .record(zod.nativeEnum(DatabaseName), zod.boolean())
      .optional(),
    networkStatus: zod.boolean().optional(),
  }),
  zod.object({
    health_check_time_start: zod.string(),
    health_check_time_end: zod.string(),
  }),
)(
  () => ({
    headers: zod.object({
      check_handler: zod.string().optional(),
      check_database: zod.string().optional(),
      check_network: zod.string().optional(),
    }),
  }),
  (dependencies) => ({
    name: RouteName.internalHealthCheckRoute,
    method: 'get',
    path: '/internal/health-check',
    middlewares: {
      before: [dependencies.authorizationMiddleware],
      after: [dependencies.errorHandlerMiddleware],
    },
    handler: async (req, res, sendResponse) => {
      const startTime = DateTime.now()
      if (req.headers.check_handler === undefined) {
        return sendResponse(
          StatusCodes.OK,
          new Result(true, 'route succeed', {}),
          {
            health_check_time_start: startTime.toISO(),
            health_check_time_end: DateTime.now().toISO(),
          },
        )
      }
      const internalHealthCheckHandlerResult =
        await dependencies.internalHealthCheckHandler.execute({
          checkDatabase: req.headers.check_database !== undefined,
          checkNetwork: req.headers.check_network !== undefined,
        })
      if (internalHealthCheckHandlerResult.succeed === false) {
        return sendResponse(
          StatusCodes.SERVICE_UNAVAILABLE,
          new Result(true, 'route succeed', {}),
          {
            health_check_time_start: startTime.toISO(),
            health_check_time_end: DateTime.now().toISO(),
          },
        )
      }
      return sendResponse(
        StatusCodes.OK,
        new Result(true, 'route succeed', {
          databaseConnectionStatus:
            internalHealthCheckHandlerResult.data.databaseConnectionStatus,
          networkStatus: internalHealthCheckHandlerResult.data.networkStatus,
        }),
        {
          health_check_time_start: startTime.toISO(),
          health_check_time_end: DateTime.now().toISO(),
        },
      )
    },
  }),
)
