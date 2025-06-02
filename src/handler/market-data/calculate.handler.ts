import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'

export const marketDataCalculateHandler = createHandler<
  { symbol: string; timeStart: number; timeEnd: number },
  { priceDifferenceChange: number },
  'HANDLER_NO_DATA_ERROR' | 'HANDLER_EXECUTION_ERROR'
>(HandlerName.MARKET_DATA_CALCULATE, (dependencies) => async (payload) => {
  const getHistoricalDataResult =
    await dependencies.binanceIntegration.getHistoricalData({
      symbol: payload.symbol,
      startTime: payload.timeStart,
      endTime: payload.timeEnd,
    })

  if (getHistoricalDataResult.succeed === false) {
    switch (getHistoricalDataResult.name) {
      case 'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR':
        return new Result(
          false,
          'handler acquiring data failed',
          payload,
          'HANDLER_NO_DATA_ERROR',
          getHistoricalDataResult,
        )
      default:
        return new Result(
          false,
          'handler execution failed',
          payload,
          'HANDLER_EXECUTION_ERROR',
          getHistoricalDataResult,
        )
    }
  }

  return new Result(true, `handler market data calculate succeed`, {
    priceDifferenceChange:
      getHistoricalDataResult.data.closePrice -
      getHistoricalDataResult.data.openPrice,
  })
})
