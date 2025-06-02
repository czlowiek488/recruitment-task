import type { Dependencies } from '../app'
import { DatabaseName } from '../shared/enum/database-name.enum'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BaseMysqlRepository = {
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

export const baseMysqlRepository = (
  dependencies: Dependencies,
): BaseMysqlRepository => {
  const getInstanceResult = dependencies.dbManager.getInstance(
    DatabaseName.MYSQL,
  )
  if (getInstanceResult.succeed === false) {
    throw new Result(
      false,
      'db mysql connection failed',
      {},
      'DB_CONNECTION_ERROR',
      getInstanceResult,
    ).destroyToThrow()
  }
  return {
    getById: async (payload) => {
      const result = await getInstanceResult.data
        .selectFrom('baseTable')
        .select(['counter', 'id'])
        .where('id', '=', payload.counterId)
        .executeTakeFirst()

      if (result === undefined) {
        return new Result(
          false,
          'db mysql item not found',
          payload,
          'DB_NOT_FOUND_ERROR',
        )
      }
      return new Result(true, 'db mysql item found', {
        id: result.id,
        counter: Number(result.counter),
      })
    },
    createCounter: async (payload) => {
      try {
        await getInstanceResult.data
          .insertInto('baseTable')
          .values({
            id: payload.id,
            counter: payload.counter,
          })
          .executeTakeFirst()
        return new Result(true, 'db mysql item inserted', {})
      } catch (error) {
        return new Result(
          false,
          'db mysql connection failed',
          payload,
          'DB_CONNECTION_ERROR',
          error,
        )
      }
    },
  }
}
