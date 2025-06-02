import { v4 } from 'uuid'
import { createHandler } from '../../shared/structure/handler.structure'
import { HandlerName } from '../../shared/enum/handler-name.enum'
import { Result } from '../../shared/lib/result.lib'

export const internalTest1Handler = createHandler<
  { counter: number },
  { counterId: string },
  'HANDLER_INVALID_COUNTER_ERROR' | 'HANDLER_CREATE_COUNTER_ERROR'
>(HandlerName.INTERNAL_TEST_1, (dependencies) => async (payload) => {
  if (payload.counter < 0) {
    return new Result(
      false,
      'handler invalid counter amount',
      payload,
      'HANDLER_INVALID_COUNTER_ERROR',
    )
  }
  await dependencies.baseIntegration.getGoogle()
  const counterId = v4()
  const createCounterMongoResult =
    await dependencies.baseMongoRepository.createCounter({
      counter: payload.counter,
      id: counterId,
    })
  if (createCounterMongoResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_CREATE_COUNTER_ERROR',
      createCounterMongoResult,
    )
  }

  const createCounterPostgresResult =
    await dependencies.basePostgresRepository.createCounter({
      counter: payload.counter,
      id: counterId,
    })
  if (createCounterPostgresResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_CREATE_COUNTER_ERROR',
      createCounterPostgresResult,
    )
  }

  const createCounterMysqlResult =
    await dependencies.baseMysqlRepository.createCounter({
      counter: payload.counter,
      id: counterId,
    })
  if (createCounterMysqlResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_CREATE_COUNTER_ERROR',
      createCounterMysqlResult,
    )
  }
  const createCounterRedisResult =
    await dependencies.baseRedisRepository.createCounter({
      counter: payload.counter,
      id: counterId,
    })
  if (createCounterRedisResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_CREATE_COUNTER_ERROR',
      createCounterRedisResult,
    )
  }
  const createCounterDynamoResult =
    await dependencies.baseDynamoRepository.createCounter({
      counter: payload.counter,
      id: counterId,
    })
  if (createCounterDynamoResult.succeed === false) {
    return new Result(
      false,
      'handler create counter failed',
      payload,
      'HANDLER_CREATE_COUNTER_ERROR',
      createCounterDynamoResult,
    )
  }
  return new Result(true, 'handler internal test 1 succeed', { counterId })
})
