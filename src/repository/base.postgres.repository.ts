import type { Dependencies } from '../app'
import { DatabaseName } from '../shared/enum/database-name.enum'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'

export type BasePostgresRepository = {
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

export const basePostgresRepository = (
  dependencies: Dependencies,
): BasePostgresRepository => {
  const postgresGetDb = dependencies.dbManager.getInstance(
    DatabaseName.POSTGRES,
  )
  if (postgresGetDb.succeed === false) {
    throw new Result(
      false,
      'db postgres connection failed',
      {},
      'DB_CONNECTION_ERROR',
      postgresGetDb,
    ).destroyToThrow()
  }
  return {
    getById: async (payload) => {
      const result = await postgresGetDb.data
        .selectFrom('baseTable')
        .select(['baseTable.counter', 'baseTable.id'])
        .where('baseTable.id', '=', payload.counterId)
        .executeTakeFirst()

      if (result === undefined) {
        return new Result(
          false,
          'db postgres item not found',
          {},
          'DB_NOT_FOUND_ERROR',
          postgresGetDb,
        )
      }
      return new Result(true, 'db postgres item found', {
        id: result.id,
        counter: result.counter,
      })
    },
    createCounter: async (payload) => {
      try {
        const result = await postgresGetDb.data
          .insertInto('baseTable')
          .values({
            id: payload.id,
            counter: payload.counter,
          })
          .returning('baseTable.id')
          .executeTakeFirst()
        if (result?.id === undefined) {
          return new Result(
            false,
            'db postgres insert failed',
            {},
            'DB_INSERT_ERROR',
            postgresGetDb,
          )
        }
        return new Result(true, 'db postgres item inserted', {})
      } catch (error) {
        return new Result(
          false,
          'db postgres connection failed',
          {},
          'DB_CONNECTION_ERROR',
          error,
        )
      }
    },
  }
}
