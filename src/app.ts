import { loadConfig } from './app.config'
import { logger } from './shared/lib/logger.lib'
import { mongoDb } from './shared/db/mongo/mongo.db'
import { httpServer } from './shared/lib/server.lib'
import type { HttpServer } from './shared/lib/server.lib'
import type { Logger } from './shared/lib/logger.lib'
import { asProxied, asValue, createContainer } from './shared/lib/awilix.lib'
import type { AwilixContainer } from './shared/lib/awilix.lib'
import { internalTest1Handler } from './handler/internal/test-1.handler'
import { baseMongoRepository } from './repository/base.mongo.repository'
import type { BaseMongoRepository } from './repository/base.mongo.repository'
import { internalTest1Route } from './route/internal/base.route.post'
import { initializeAxios } from './shared/lib/axios.lib'
import { errorHandlerMiddleware } from './shared/middleware/error-handler.middleware'
import { expressApp } from './shared/lib/express.lib'
import type { ExpressApp } from './shared/lib/express.lib'
import { notFoundMiddleware } from './shared/middleware/not-found.middleware'
import { bodyParserMiddleware } from './shared/middleware/body-parser.middleware'
import { baseIntegration } from './integration/base.integration'
import type { BaseIntegration } from './integration/base.integration'
import { postgresDb } from './shared/db/postgres/postgres.db'
import { basePostgresRepository } from './repository/base.postgres.repository'
import type { BasePostgresRepository } from './repository/base.postgres.repository'
import { mysqlDb } from './shared/db/mysql/mysql.db'
import { baseMysqlRepository } from './repository/base.mysql.repository'
import type { BaseMysqlRepository } from './repository/base.mysql.repository'
import { redisDb } from './shared/db/redis/redis.db'
import { baseRedisRepository } from './repository/base.redis.repository'
import type { BaseRedisRepository } from './repository/base.redis.repository'
import { dynamoDb } from './shared/db/dynamo/dynamo.db'
import { baseDynamoRepository } from './repository/base.dynamo.repository'
import type { BaseDynamoRepository } from './repository/base.dynamo.repository'
import {
  googleEndpoint,
  test2Endpoint,
} from './integration/base.integration.endpoint'
import { internalTest2Handler } from './handler/internal/test-2.handler'
import { internalTest2Route } from './route/internal/test2.route.get'
import type { Config } from './app.config'
import { loggerProxy } from './shared/proxy/dependency-logger.proxy'
import { authorizationMiddleware } from './shared/middleware/authorization.middleware'
import { Result } from './shared/lib/result.lib'
import type { FunctionResult } from './shared/lib/result.lib'
import { appManager } from './app.manager'
import type { AppManager } from './app.manager'
import { createDbManager } from './shared/db/db.manager'
import { healthCheckGetRoute } from './route/internal/health-check.route.get'
import { internalHealthCheckHandler } from './handler/internal/health-check.handler'
import { calculateMarketDataRoute } from './route/market-data/calculate.post'
import { marketDataCalculateHandler } from './handler/market-data/calculate.handler'
import { binanceKlinesEndpoint } from './integration/binance.integration.endpoint'

export const dbManager = createDbManager({
  REDIS: redisDb,
  DYNAMO: dynamoDb,
  MONGO: mongoDb,
  MYSQL: mysqlDb,
  POSTGRES: postgresDb,
})

export type Dependencies = {
  // app
  appManager: AppManager
  dbManager: ReturnType<typeof dbManager>
  config: Config
  logger: Logger

  // network
  httpServer: HttpServer
  express: ExpressApp
  axios: ReturnType<typeof initializeAxios>

  // db
  mongoDb: ReturnType<typeof mongoDb>
  postgresDb: ReturnType<typeof postgresDb>
  mysqlDb: ReturnType<typeof mysqlDb>
  redisDb: ReturnType<typeof redisDb>
  dynamoDb: ReturnType<typeof dynamoDb>

  // mongo repository
  baseMongoRepository: BaseMongoRepository

  // postgres repository
  basePostgresRepository: BasePostgresRepository

  // mysql repository
  baseMysqlRepository: BaseMysqlRepository

  // redis repository
  baseRedisRepository: BaseRedisRepository

  // dynamo repository
  baseDynamoRepository: BaseDynamoRepository

  // middleware list
  errorHandlerMiddleware: ReturnType<typeof errorHandlerMiddleware>
  notFoundMiddleware: ReturnType<typeof notFoundMiddleware>
  bodyParserMiddleware: ReturnType<typeof bodyParserMiddleware>
  authorizationMiddleware: ReturnType<typeof authorizationMiddleware>

  // integration list
  baseIntegration: BaseIntegration

  // route list
  internalTest1Route: ReturnType<typeof internalTest1Route>
  internalTest2Route: ReturnType<typeof internalTest2Route>
  healthCheckGetRoute: ReturnType<typeof healthCheckGetRoute>
  calculateMarketDataRoute: ReturnType<typeof calculateMarketDataRoute>

  // handler list
  internalTest1Handler: ReturnType<typeof internalTest1Handler>
  internalTest2Handler: ReturnType<typeof internalTest2Handler>
  internalHealthCheckHandler: ReturnType<typeof internalHealthCheckHandler>
  marketDataCalculateHandler: ReturnType<typeof marketDataCalculateHandler>

  // endpoint list
  googleEndpoint: ReturnType<typeof googleEndpoint>
  test2Endpoint: ReturnType<typeof test2Endpoint>
  binanceKlinesEndpoint: ReturnType<typeof binanceKlinesEndpoint>
}

export const routeList = {
  // route list
  internalTest1Route: asProxied(internalTest1Route, []),
  internalTest2Route: asProxied(internalTest2Route, []),
  healthCheckGetRoute: asProxied(healthCheckGetRoute, []),
  calculateMarketDataRoute: asProxied(calculateMarketDataRoute, []),
}

export const loadAppContainer = <TDependencies extends Dependencies>(
  env: NodeJS.ProcessEnv,
  parentContainer: AwilixContainer<TDependencies> = createContainer<TDependencies>(),
): FunctionResult<
  AwilixContainer<TDependencies>,
  'CONTAINER_LOADING_ERROR'
> => {
  logger.debug(`app container loading...`)
  const configLoadResult = loadConfig(env)
  if (configLoadResult.succeed === false) {
    return new Result(
      false,
      'container loading failed',
      {},
      'CONTAINER_LOADING_ERROR',
      configLoadResult,
    )
  }
  const container = parentContainer.register(<any>{
    config: asValue(configLoadResult.data),
    // app
    appManager: asProxied(appManager, [loggerProxy()]).singleton(),
    dbManager: asProxied(dbManager, [
      loggerProxy({
        dependencyName: 'dbManager',
        doNotLogFunctionNames: ['getInstance'],
      }),
    ]).singleton(),
    express: asProxied(expressApp, [
      loggerProxy({
        doNotLogFunctionNames: [
          'attachMiddleware',
          'attachRoute',
          'sendResponse',
        ],
      }),
    ]).singleton(),
    httpServer: asProxied(httpServer, [loggerProxy()]).singleton(),
    axios: asProxied(initializeAxios, []).singleton(),

    // mongo repository
    baseMongoRepository: asProxied(baseMongoRepository, [loggerProxy()]),

    // postgres repository
    basePostgresRepository: asProxied(basePostgresRepository, [loggerProxy()]),

    // mysql repository
    baseMysqlRepository: asProxied(baseMysqlRepository, [loggerProxy()]),

    // redis repository
    baseRedisRepository: asProxied(baseRedisRepository, [loggerProxy()]),

    // dynamo repository
    baseDynamoRepository: asProxied(baseDynamoRepository, [loggerProxy()]),

    // middleware list
    errorHandlerMiddleware: asProxied(errorHandlerMiddleware, []),
    notFoundMiddleware: asProxied(notFoundMiddleware, []),
    bodyParserMiddleware: asProxied(bodyParserMiddleware, []),
    authorizationMiddleware: asProxied(authorizationMiddleware, []),

    // integration list
    baseIntegration: asProxied(baseIntegration, [loggerProxy()]),

    // handler list
    internalTest1Handler: asProxied(internalTest1Handler, [
      loggerProxy({ dependencyName: 'handlerInternalTest1' }),
    ]),
    internalTest2Handler: asProxied(internalTest2Handler, [
      loggerProxy({ dependencyName: 'internalTest2Handler' }),
    ]),
    internalHealthCheckHandler: asProxied(internalHealthCheckHandler, [
      loggerProxy({ dependencyName: 'internalHealthCheckHandler' }),
    ]),
    marketDataCalculateHandler: asProxied(marketDataCalculateHandler, [
      loggerProxy({ dependencyName: 'marketDataCalculateHandler' }),
    ]),

    // endpoint list
    googleEndpoint: asProxied(googleEndpoint, [
      loggerProxy({ dependencyName: 'googleEndpoint' }),
    ]).singleton(),
    test2Endpoint: asProxied(test2Endpoint, [
      loggerProxy({ dependencyName: 'test2Endpoint' }),
    ]).singleton(),
    binanceKlinesEndpoint: asProxied(binanceKlinesEndpoint, [
      loggerProxy({ dependencyName: 'binanceKlinesEndpoint' }),
    ]).singleton(),

    //route list
    ...routeList,
  })
  return new Result(true, 'container loading succeed', container)
}
