import type { Dependencies } from '../app'
import { DatabaseName } from '../shared/enum/database-name.enum'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BaseRedisEntitySchema = {
  id: string
  counter: number
}

export type BaseRedisRepository = {
  createCounter: (payload: {
    counter: number
    id: string
  }) => FunctionResult<Promise<{}>, 'DB_INSERT_ERROR' | 'DB_CONNECTION_ERROR'>
  getById: (payload: {
    counterId: string
  }) => FunctionResult<Promise<BaseRedisEntitySchema>, 'DB_NOT_FOUND_ERROR'>
}

export const baseRedisRepository = (
  dependencies: Dependencies,
): BaseRedisRepository => {
  const getInstanceResult = dependencies.dbManager.getInstance(
    DatabaseName.REDIS,
  )
  if (getInstanceResult.succeed === false) {
    throw new Result(
      false,
      'db redis connection failed',
      {},
      'DB_CONNECTION_ERROR',
      getInstanceResult,
    ).destroyToThrow()
  }
  return {
    getById: async (payload) => {
      const result = await getInstanceResult.data.get(
        `base:${payload.counterId}`,
      )
      if (result === null) {
        return new Result(
          false,
          'db redis item not found',
          payload,
          'DB_NOT_FOUND_ERROR',
        )
      }
      return new Result(
        true,
        'db redis item found',
        JSON.parse(result) as BaseRedisEntitySchema,
      )
    },
    createCounter: async (payload) => {
      try {
        const result = await getInstanceResult.data.set(
          `base:${payload.id}`,
          JSON.stringify({
            id: payload.id,
            counter: payload.counter,
          }),
        )
        if (result !== 'OK') {
          return new Result(
            false,
            'db redis insert failed',
            payload,
            'DB_INSERT_ERROR',
          )
        }
        return new Result(true, 'db redis item inserted', {})
      } catch (error) {
        return new Result(
          false,
          'db redis connection failed',
          payload,
          'DB_CONNECTION_ERROR',
          error,
        )
      }
    },
  }
}
