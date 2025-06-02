import { StatusCodes } from 'http-status-codes'
import { zod } from '../../shared/lib/zod.lib'
import { createRoute } from '../../shared/structure/route.structure'
import { DatabaseName } from '../../shared/enum/database-name.enum'
import { Result } from '../../shared/lib/result.lib'
import { RouteName } from '../../shared/enum/route-name.enum'

export const internalTest2Route = createRoute(
  zod.object({ counter: zod.number() }),
  zod.object({}),
)(
  () => ({
    params: zod.object({ counterId: zod.string() }),
    query: zod.object({ databaseType: zod.nativeEnum(DatabaseName) }),
  }),
  (dependencies) => ({
    name: RouteName.internalTest2Route,
    method: 'get',
    path: '/internal/test_2/:counterId',
    middlewares: {
      before: [
        dependencies.authorizationMiddleware,
        dependencies.bodyParserMiddleware,
      ],
      after: [dependencies.errorHandlerMiddleware],
    },
    handler: async (req, res, sendResponse) => {
      const result = await dependencies.internalTest2Handler.execute({
        counterId: req.params.counterId,
        databaseType: req.query.databaseType,
      })
      if (result.succeed === true) {
        return sendResponse(
          StatusCodes.OK,
          new Result(true, 'route succeed', {
            counter: result.data.counter,
          }),
          {},
        )
      }
      switch (result.errorName) {
        case 'HANDLER_GET_COUNTER_ERROR':
          return sendResponse(
            StatusCodes.CONFLICT,
            new Result(
              false,
              'handler test_2 failed',
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
