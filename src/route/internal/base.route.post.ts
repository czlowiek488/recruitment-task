import { StatusCodes } from 'http-status-codes'
import { zod } from '../../shared/lib/zod.lib'
import { createRoute } from '../../shared/structure/route.structure'
import { Result } from '../../shared/lib/result.lib'
import { RouteName } from '../../shared/enum/route-name.enum'

export const internalTest1Route = createRoute(
  zod.object({ counterId: zod.string() }),
  zod.object({}),
)(
  () => ({
    body: zod.object({
      counter: zod.number(),
    }),
  }),
  (dependencies) => ({
    name: RouteName.internalTest1Route,
    method: 'post',
    path: '/base',
    middlewares: {
      before: [
        dependencies.authorizationMiddleware,
        dependencies.bodyParserMiddleware,
      ],
      after: [dependencies.errorHandlerMiddleware],
    },
    handler: async (req, res, sendResponse) => {
      const result = await dependencies.internalTest1Handler.execute({
        counter: req.body.counter,
      })
      if (result.succeed === true) {
        return sendResponse(
          StatusCodes.OK,
          new Result(true, 'route succeed', {
            counterId: result.data.counterId,
          }),
          {},
        )
      }
      switch (result.errorName) {
        case 'HANDLER_INVALID_COUNTER_ERROR':
          return sendResponse(
            StatusCodes.CONFLICT,
            new Result(
              false,
              'handler google failed',
              {},
              'HANDLER_EXECUTION_ERROR',
              result,
            ),
            {},
          )
        default:
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
      }
    },
  }),
)
