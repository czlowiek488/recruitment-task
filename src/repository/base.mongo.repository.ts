import type { Dependencies } from '../app'
import { CollectionName } from '../shared/db/mongo/mongo.db'
import { DatabaseName } from '../shared/enum/database-name.enum'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BaseMongoRepository = {
  createCounter: (payload: {
    counter: number
    id: string
  }) => FunctionResult<Promise<{}>, 'DB_CONNECTION_ERROR' | 'DB_INSERT_ERROR'>
  getById: (payload: {
    counterId: string
  }) => FunctionResult<Promise<Base>, 'DB_NOT_FOUND_ERROR'>
}

export type Base = {
  id: string
  counter: number
}

export const baseMongoRepository = (
  dependencies: Dependencies,
): BaseMongoRepository => {
  const getInstanceResult = dependencies.dbManager.getInstance(
    DatabaseName.MONGO,
  )

  if (getInstanceResult.succeed === false) {
    throw new Result(
      false,
      'db mongo connection failed',
      {},
      'DB_CONNECTION_ERROR',
      getInstanceResult,
    ).destroyToThrow()
  }
  const collection = getInstanceResult.data.collection<Base>(
    CollectionName.BASE_COLLECTION,
  )
  return {
    getById: async (payload) => {
      const result = await collection.findOne({
        id: payload.counterId,
      })

      if (result === null) {
        return new Result(
          false,
          'db mongo item not found',
          {},
          'DB_NOT_FOUND_ERROR',
        )
      }
      return new Result(true, 'db mongo item found', {
        id: result.id,
        counter: result.counter,
      })
    },
    createCounter: async (payload) => {
      try {
        const result = await collection.insertOne({
          id: payload.id,
          counter: payload.counter,
        })

        if (result.acknowledged === false) {
          return new Result(
            false,
            'db mongo insert failed',
            result,
            'DB_INSERT_ERROR',
          )
        }
        return new Result(true, 'db mongo item inserted', {})
      } catch (error) {
        return new Result(
          false,
          'db mongo connection failed',
          {},
          'DB_CONNECTION_ERROR',
          error,
        )
      }
    },
  }
}
