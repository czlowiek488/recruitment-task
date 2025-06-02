import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { expect, it } from 'vitest'
import {
  assureConfig,
  axiosCommonHeadersExpectation,
  testDependencies,
} from '../setup'

it('internal - test 1 > route not found', async () => {
  const assureConfigResult = await assureConfig({})
  if (assureConfigResult.succeed === false) {
    throw assureConfigResult.destroyToThrow()
  }
  const result = await testDependencies.axios({
    url: `http://127.0.0.1:${testDependencies.config.APP_PORT}/non_existing_path`,
  })
  expect(result.status).toStrictEqual(StatusCodes.NOT_FOUND)
  expect(result.data).toStrictEqual({
    error: {
      name: 'ROUTE_ENDPOINT_NOT_FOUND_ERROR',
      message: 'route not found',
      list: [
        {
          causeList: ['ROUTE_ENDPOINT_NOT_FOUND_ERROR'],
          data: {
            method: 'GET',
            url: '/non_existing_path',
          },
          id: expect.any(String),
          message: 'route not found',
          name: 'ROUTE_ENDPOINT_NOT_FOUND_ERROR',
          path: expect.any(String),
          parent: null,
          stack: expect.any(String),
          succeed: false,
        },
      ],
    },
    data: {
      method: 'GET',
      url: '/non_existing_path',
    },
    statusCode: StatusCodes.NOT_FOUND,
    statusText: ReasonPhrases.NOT_FOUND,
    succeed: false,
  })
})

it('internal - test 1 > happy path: response', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()
  expect(result.postBaseResult.data).toStrictEqual({
    statusCode: StatusCodes.OK,
    responseBody: {
      succeed: true,
      statusCode: StatusCodes.OK,
      statusText: ReasonPhrases.OK,
      data: {
        counterId: expect.any(String),
      },
    },
    responseHeaders: axiosCommonHeadersExpectation,
  })
})

it('internal - test 1 > happy path: google request', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  await dataset.execute()

  expect(dataset.mocks.googleEndpoint.get().requestList).toStrictEqual([
    {
      request: {
        body: {},
        params: {},
        search: {},
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-encoding': 'gzip, compress, deflate, br',
          connection: 'close',
          host: 'google.com',
          'user-agent': 'axios/1.9.0',
        },
      },
      response: {
        body: 'DONE',
        headers: undefined,
        statusCode: StatusCodes.OK,
      },
    },
  ])
})

it('internal - test 1 > happy path: mongo data', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()
  const mongoData = await testDependencies.baseMongoRepository.getById({
    counterId: result.postBaseResult.data.responseBody.data.counterId,
  })

  expect(mongoData.normalize()).toStrictEqual({
    message: 'db mongo item found',
    causeList: mongoData.normalizeCauseList(),
    parent: null,
    id: expect.any(String),
    stack: expect.any(String),
    path: expect.any(String),
    executionId: undefined,
    succeed: true,
    errorCause: undefined,
    name: 'Succeed',
    data: {
      counter: dataset.payload.counter,
      id: result.postBaseResult.data.responseBody.data.counterId,
    },
  })
})

it('internal - test 1 > happy path: postgres data', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()

  const postgresData = await testDependencies.basePostgresRepository.getById({
    counterId: result.postBaseResult.data.responseBody.data.counterId,
  })

  expect(postgresData.normalize()).toStrictEqual({
    message: 'db postgres item found',
    causeList: postgresData.normalizeCauseList(),
    parent: null,
    id: expect.any(String),
    stack: expect.any(String),
    path: expect.any(String),
    executionId: undefined,
    succeed: true,
    errorCause: undefined,
    name: 'Succeed',
    data: {
      counter: dataset.payload.counter,
      id: result.postBaseResult.data.responseBody.data.counterId,
    },
  })
})

it('internal - test 1 > happy path: mysql data', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()
  const mysqlData = await testDependencies.baseMysqlRepository.getById({
    counterId: result.postBaseResult.data.responseBody.data.counterId,
  })

  expect(mysqlData.normalize()).toStrictEqual({
    message: 'db mysql item found',
    causeList: mysqlData.normalizeCauseList(),
    parent: null,
    id: expect.any(String),
    path: expect.any(String),
    executionId: undefined,
    errorCause: undefined,
    stack: expect.any(String),
    name: 'Succeed',
    succeed: true,
    data: {
      counter: dataset.payload.counter,
      id: result.postBaseResult.data.responseBody.data.counterId,
    },
  })
})

it('internal - test 1 > happy path: redis data', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()

  const redisData = await testDependencies.baseRedisRepository.getById({
    counterId: result.postBaseResult.data.responseBody.data.counterId,
  })

  expect(redisData.normalize()).toStrictEqual({
    message: 'db redis item found',
    causeList: redisData.normalizeCauseList(),
    parent: null,
    id: expect.any(String),
    executionId: undefined,
    stack: expect.any(String),
    path: expect.any(String),
    succeed: true,
    errorCause: undefined,
    name: 'Succeed',
    data: {
      counter: dataset.payload.counter,
      id: result.postBaseResult.data.responseBody.data.counterId,
    },
  })
})

it('internal - test 1 > happy path: dynamodb data', async () => {
  const dataset = await testDependencies.prepareInternalTest1({
    counter: 1,
  })

  const result = await dataset.execute()

  const dynamoData = await testDependencies.baseDynamoRepository.getById({
    counterId: result.postBaseResult.data.responseBody.data.counterId,
  })

  expect(dynamoData.normalize()).toStrictEqual({
    message: 'db dynamo item found',
    causeList: dynamoData.normalizeCauseList(),
    parent: null,
    id: expect.any(String),
    executionId: undefined,
    succeed: true,
    stack: expect.any(String),
    errorCause: undefined,
    path: expect.any(String),
    name: 'Succeed',
    data: {
      counter: dataset.payload.counter,
      id: result.postBaseResult.data.responseBody.data.counterId,
    },
  })
})
