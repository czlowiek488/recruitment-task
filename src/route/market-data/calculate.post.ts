import { StatusCodes } from 'http-status-codes'
import { zod } from '../../shared/lib/zod.lib'
import { createRoute } from '../../shared/structure/route.structure'
import { Result } from '../../shared/lib/result.lib'
import { RouteName } from '../../shared/enum/route-name.enum'

export const calculateMarketDataRoute = createRoute(
  zod.object({}),
  zod.object({}),
)(
  () => ({
    body: zod.object({
      symbol: zod.string(),
      timeStart: zod.number(),
      timeEnd: zod.number(),
    }),
  }),
  (dependencies) => ({
    name: RouteName.calculateMarketDataRoute,
    method: 'post',
    path: '/calculate',
    middlewares: {
      before: [
        dependencies.authorizationMiddleware,
        dependencies.bodyParserMiddleware,
      ],
      after: [dependencies.errorHandlerMiddleware],
    },
    handler: async (req, res, sendResponse) => {
      const result = await dependencies.marketDataCalculateHandler.execute({})
      if (result.succeed === true) {
        return sendResponse(
          StatusCodes.OK,
          new Result(true, 'route succeed', {}),
          {},
        )
      }
      return sendResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        new Result(
          false,
          'route did not handled an error',
          {},
          'ROUTE_UNHANDLED_ERROR',
          result,
        ),
        {},
      )
    },
  }),
)
