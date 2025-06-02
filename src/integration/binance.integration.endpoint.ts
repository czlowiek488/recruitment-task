import { HTTPMethod } from 'http-method-enum'
import type { StatusCodes } from 'http-status-codes'
import type {
  EndpointData,
  EndpointRequest,
  EndpointResponse,
} from '../shared/structure/endpoint.structure'
import {
  createEndpoint,
  EndpointName,
} from '../shared/structure/endpoint.structure'

export const binanceKlinesEndpoint = createEndpoint((dependencies) => ({
  endpointName: EndpointName.BINANCE_GET_HISTORICAL_TRADE_DATA,
  method: HTTPMethod.GET,
  origin: dependencies.config.INTEGRATION_BINANCE_URL,
  path: '/v3/klines',
}))<
  EndpointData<
    EndpointRequest<
      undefined,
      undefined,
      {
        symbol: string
        interval: `${number}${'s' | 'w' | 'm' | 'd' | 'M'}`
        startTime: string
        endTime: string
      },
      undefined
    >,
    EndpointResponse<
      StatusCodes.OK,
      [
        number, // Kline open time
        string, // Open price
        string, // High price
        string, // Low price
        string, // Close price
        string, // Volume
        number, // Kline Close time
        string, // Quote asset volume
        number, // Number of trades
        string, // Taker buy base asset volume
        string, // Taker buy quote asset volume
        string, // Unused field, ignore.
      ][],
      undefined
    >
  >
>()
