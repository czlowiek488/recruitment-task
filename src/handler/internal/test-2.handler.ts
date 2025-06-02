import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { DatabaseName } from '../../shared/enum/database-name.enum'
import { Result } from '../../shared/lib/result.lib'
import type { FunctionResult } from '../../shared/lib/result.lib'

export const internalTest2Handler = createHandler<
  { counterId: string; databaseType: DatabaseName },
  { counter: number },
  'HANDLER_GET_COUNTER_ERROR' | 'HANDLER_PERFORMANCE_TEST_ERROR'
>(HandlerName.INTERNAL_TEST_2, (dependencies) => async (payload) => {
  const result = await (async (): FunctionResult<
    Promise<{ counter: number }>,
    'DB_UNSUPPORTED_TYPE_ERROR' | 'DB_GET_ERROR' | 'DB_NOT_FOUND_ERROR'
  > => {
    switch (payload.databaseType) {
      case DatabaseName.DYNAMO:
        return dependencies.baseDynamoRepository.getById({
          counterId: payload.counterId,
        })
      case DatabaseName.REDIS:
        return dependencies.baseRedisRepository.getById({
          counterId: payload.counterId,
        })
      case DatabaseName.MYSQL:
        return dependencies.baseMysqlRepository.getById({
          counterId: payload.counterId,
        })
      case DatabaseName.POSTGRES:
        return dependencies.basePostgresRepository.getById({
          counterId: payload.counterId,
        })
      case DatabaseName.MONGO:
        return dependencies.baseMongoRepository.getById({
          counterId: payload.counterId,
        })
      default:
        return new Result(
          false,
          'db unsupported type',
          payload,
          'DB_UNSUPPORTED_TYPE_ERROR',
        )
    }
  })()
  if (result.succeed === false) {
    return new Result(
      false,
      'db unsupported type',
      payload,
      'HANDLER_GET_COUNTER_ERROR',
    )
  }

  const test2PerformanceResultList = await Promise.all(
    Array.from({ length: result.data.counter }).map(() =>
      dependencies.baseIntegration.performTest2(),
    ),
  )

  const failedTest2Performances = test2PerformanceResultList.filter(
    (test2PerformanceResult) => test2PerformanceResult.succeed === false,
  )

  if (failedTest2Performances.length > 0) {
    return new Result(
      false,
      'db unsupported type',
      payload,
      'HANDLER_PERFORMANCE_TEST_ERROR',
    )
  }
  return new Result(true, 'handler internal test 2 succeed', {
    counter: result.data.counter,
  })
})
