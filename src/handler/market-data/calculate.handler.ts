import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'

export const marketDataCalculateHandler = createHandler<
  { symbol: string; timeStart: number; timeEnd: number },
  { priceDifferenceChange: number },
  any
>(HandlerName.INTERNAL_HEALTH_CHECK, (dependencies) => async (payload) => {
  const getHistoricalDataResult =
    await dependencies.binanceIntegration.getHistoricalData({
      symbol: payload.symbol,
      startTime: payload.timeStart,
      endTime: payload.timeEnd,
    })

  if (getHistoricalDataResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_EXECUTION_ERROR',
      getHistoricalDataResult,
    )
  }

  return new Result(true, `handler internal health check succeed`, {
    priceDifferenceChange:
      getHistoricalDataResult.data.closePrice -
      getHistoricalDataResult.data.openPrice,
  })
})
