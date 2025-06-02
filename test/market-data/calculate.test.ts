import { DateTime } from 'luxon'
import { axiosCommonHeadersExpectation, testDependencies } from '../setup'
import { expect, it } from 'vitest'
import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { prepareMarketDataCalculateTest } from './calculate.test.prepare'

it('market data - get historical data api', async () => {
  const testResult = await testDependencies.calculateMarketDataRoute.test({
    body: {
      symbol: 'BTCUSDT',
      timeStart: DateTime.now().toMillis() - 1_000_000,
      timeEnd: DateTime.now().toMillis(),
    },
  })

  expect(testResult.data).toStrictEqual({
    responseBody: {
      data: {
        priceDifferenceChange: expect.any(Number),
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
      data: {},
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
        body: {
          priceDifferenceChange: expect.any(Number),
        },
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

it('market data - get historical data mocks - no data', async () => {
  const test = await prepareMarketDataCalculateTest({
    noData: true,
  })

  const result = await test.execute()

  expect(result.calculateMarketDataRouteTestResult.data).toStrictEqual({
    responseBody: {
      data: {},
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
        body: {
          priceDifferenceChange: expect.any(Number),
        },
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
