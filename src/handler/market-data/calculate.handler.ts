import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'
import type { BinanceIntervalCharacter } from '../../integration/binance.integration.endpoint'

export const marketDataCalculateHandler = createHandler<
  {
    symbol: string
    timeStart: number
    timeEnd: number
    interval: BinanceIntervalCharacter
  },
  {
    lowestOpenPrice: number
    highestOpenPrice: number
    lowestClosePrice: number
    highestClosePrice: number
    volumeSum: number
    numberOfAllTrades: number
    changeList: {
      openPrice: number
      closePrice: number
      volume: number
      openTime: number
      closeTime: number
      numberOfTrades: number
    }[]
  },
  'HANDLER_NO_DATA_ERROR' | 'HANDLER_EXECUTION_ERROR'
>(HandlerName.MARKET_DATA_CALCULATE, (dependencies) => async (payload) => {
  const getHistoricalDataResult =
    await dependencies.binanceIntegration.getHistoricalData({
      symbol: payload.symbol,
      startTime: payload.timeStart,
      endTime: payload.timeEnd,
      interval: payload.interval,
    })
  if (getHistoricalDataResult.succeed === true) {
    const changeListSortedByOpenPrice =
      getHistoricalDataResult.data.changeList.sort(
        (a, b) => a.openPrice - b.openPrice,
      )
    const changeListSortedByClosePrice =
      getHistoricalDataResult.data.changeList.sort(
        (a, b) => a.closePrice - b.closePrice,
      )
    const volumeSum = getHistoricalDataResult.data.changeList.reduce(
      (acc, change) => acc + change.volume,
      0,
    )
    const numberOfAllTrades = getHistoricalDataResult.data.changeList.reduce(
      (acc, change) => acc + change.numberOfTrades,
      0,
    )
    return new Result(true, `handler market data calculate succeed`, {
      lowestOpenPrice: changeListSortedByOpenPrice[0]!.openPrice,
      highestOpenPrice: changeListSortedByOpenPrice.at(-1)!.openPrice,
      lowestClosePrice: changeListSortedByClosePrice[0]!.closePrice,
      highestClosePrice: changeListSortedByClosePrice.at(-1)!.closePrice,
      volumeSum,
      numberOfAllTrades,
      changeList: getHistoricalDataResult.data.changeList,
    })
  }
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
})
