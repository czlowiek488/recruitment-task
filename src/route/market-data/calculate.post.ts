import { StatusCodes } from 'http-status-codes'
import { zod } from '../../shared/lib/zod.lib'
import { createRoute } from '../../shared/structure/route.structure'
import { Result } from '../../shared/lib/result.lib'
import { RouteName } from '../../shared/enum/route-name.enum'
import { BinanceIntervalCharacter } from '../../integration/binance.integration.endpoint'

export const calculateMarketDataRoute = createRoute(
  zod.object({
    lowestOpenPrice: zod.number(),
    highestOpenPrice: zod.number(),
    lowestClosePrice: zod.number(),
    highestClosePrice: zod.number(),
    volumeSum: zod.number(),
    numberOfAllTrades: zod.number(),
    changeList: zod.array(
      zod.object({
        openPrice: zod.number(),
        closePrice: zod.number(),
        volume: zod.number(),
        openTime: zod.number(),
        closeTime: zod.number(),
        numberOfTrades: zod.number(),
      }),
    ),
  }),
  zod.object({}),
)(
  () => ({
    body: zod.object({
      symbol: zod.string(),
      timeStart: zod.number(),
      timeEnd: zod.number(),
      interval: zod.nativeEnum(BinanceIntervalCharacter),
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
      const result = await dependencies.marketDataCalculateHandler.execute({
        symbol: req.body.symbol,
        timeEnd: req.body.timeEnd,
        timeStart: req.body.timeStart,
        interval: req.body.interval,
      })
      if (result.succeed === true) {
        return sendResponse(
          StatusCodes.OK,
          new Result(true, 'route succeed', result.data),
          {},
        )
      }
      switch (result.name) {
        case 'HANDLER_NO_DATA_ERROR':
          return sendResponse(
            StatusCodes.CONFLICT,
            new Result(
              false,
              'route conflict',
              {},
              'ROUTE_CONFLICT_ERROR',
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
