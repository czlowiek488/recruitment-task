import { DateTime } from 'luxon'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'
import { expect, it } from 'vitest'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { prepareMarketDataCalculateTest } from './calculate.test.prepare'
import { BinanceIntervalCharacter } from '../../src/integration/binance.integration.endpoint'

it('market data - get historical data api', async () => {
  const testResult = await testDependencies.calculateMarketDataRoute.test({
    body: {
      symbol: 'BTCUSDT',
      timeStart: DateTime.now().toMillis() - 1_000_000,
      timeEnd: DateTime.now().toMillis(),
      interval: BinanceIntervalCharacter.m,
    },
  })

  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {
        highestClosePrice: expect.any(Number),
        highestOpenPrice: expect.any(Number),
        lowestClosePrice: expect.any(Number),
        lowestOpenPrice: expect.any(Number),
        numberOfAllTrades: expect.any(Number),
        volumeSum: expect.any(Number),
        changeList: expect.arrayContaining([
          {
            closePrice: expect.any(Number),
            closeTime: expect.any(Number),
            numberOfTrades: expect.any(Number),
            openPrice: expect.any(Number),
            openTime: expect.any(Number),
            volume: expect.any(Number),
          },
        ]),
      },
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: axiosCommonHeadersExpectation,
    statusCode: StatusCodes.OK,
  })
})

it('market data - get historical data mocks - with data', async () => {
  const test = await prepareMarketDataCalculateTest({})

  const result = await test.execute()

  expect(result.calculateMarketDataRouteTestResult.data).toStrictEqual({
    responseBody: {
      data: {
        highestClosePrice: expect.any(Number),
        highestOpenPrice: expect.any(Number),
        lowestClosePrice: expect.any(Number),
        lowestOpenPrice: expect.any(Number),
        numberOfAllTrades: expect.any(Number),
        volumeSum: expect.any(Number),
        changeList: [
          {
            closePrice: expect.any(Number),
            closeTime: expect.any(Number),
            numberOfTrades: expect.any(Number),
            openPrice: expect.any(Number),
            openTime: expect.any(Number),
            volume: expect.any(Number),
          },
        ],
      },
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      succeed: true,
    },
    responseHeaders: axiosCommonHeadersExpectation,
    statusCode: StatusCodes.OK,
  })

  expect(test.mocks.binanceKlinesEndpoint.get().requestList).toStrictEqual([
    {
      request: {
        body: {},
        headers: {
          connection: 'close',
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip, compress, deflate, br',
          host: 'testnet.binance.vision',
          'user-agent': 'axios/1.9.0',
        },
        params: {},
        search: {
          endTime: expect.any(String),
          interval: expect.any(String),
          startTime: expect.any(String),
          symbol: expect.any(String),
        },
      },
      response: {
        body: [
          [
            expect.any(Number),
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(String),
            expect.any(Number),
            expect.any(String),
            expect.any(Number),
            expect.any(String),
            expect.any(String),
            expect.any(String),
          ],
        ],
        headers: undefined,
        statusCode: StatusCodes.OK,
      },
    },
  ])
})

it('market data - get historical data mocks - no data', async () => {
  const test = await prepareMarketDataCalculateTest({
    noData: true,
  })

  const result = await test.execute()

  expect(result.calculateMarketDataRouteTestResult.data).toStrictEqual({
    responseBody: {
      data: {},
      succeed: false,
      statusCode: StatusCodes.CONFLICT,
      statusText: ReasonPhrases.CONFLICT,
      error: {
        list: [
          {
            causeList: [
              'ROUTE_CONFLICT_ERROR',
              'HANDLER_NO_DATA_ERROR',
              'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR',
            ],
            data: {},
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'route conflict',
            name: 'ROUTE_CONFLICT_ERROR',
            parent: null,
            path: expect.any(String),
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: [
              'HANDLER_NO_DATA_ERROR',
              'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR',
            ],
            data: {
              symbol: expect.any(String),
              timeEnd: expect.any(Number),
              timeStart: expect.any(Number),
              interval: expect.any(String),
            },
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'handler acquiring data failed',
            name: 'HANDLER_NO_DATA_ERROR',
            parent: null,
            path: expect.any(String),
            stack: expect.any(String),
            succeed: false,
          },
          {
            causeList: ['INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR'],
            data: {},
            executionId: expect.any(String),
            id: expect.any(String),
            message: 'integration binance no kline data',
            name: 'INTEGRATION_BINANCE_NO_KLINE_DATA_ERROR',
            parent: null,
            path: expect.any(String),
            stack: expect.any(String),
            succeed: false,
          },
        ],
        message: 'route conflict',
        name: 'ROUTE_CONFLICT_ERROR',
      },
    },
    responseHeaders: axiosCommonHeadersExpectation,
    statusCode: StatusCodes.CONFLICT,
  })

  expect(test.mocks.binanceKlinesEndpoint.get().requestList).toStrictEqual([
    {
      request: {
        body: {},
        headers: {
          connection: 'close',
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip, compress, deflate, br',
          host: 'testnet.binance.vision',
          'user-agent': 'axios/1.9.0',
        },
        params: {},
        search: {
          endTime: expect.any(String),
          interval: expect.any(String),
          startTime: expect.any(String),
          symbol: expect.any(String),
        },
      },
      response: {
        body: [],
        headers: undefined,
        statusCode: StatusCodes.OK,
      },
    },
  ])
})
