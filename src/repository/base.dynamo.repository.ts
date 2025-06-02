import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import type { Dependencies } from '../app'
import { baseDynamoTable } from '../shared/db/dynamo/table/base.table'
import { Result } from '../shared/lib/result.lib'
import type { FunctionResult } from '../shared/lib/result.lib'
import { DatabaseName } from '../shared/enum/database-name.enum'

export type BaseDynamoRepository = {
  getById: (payload: {
    counterId: string
  }) => FunctionResult<
    Promise<{ id: string; counter: number }>,
    'DB_NOT_FOUND_ERROR' | 'DB_GET_ERROR'
  >
  createCounter: (payload: {
    counter: number
    id: string
  }) => FunctionResult<Promise<{}>, 'DB_INSERT_ERROR'>
}

export const baseDynamoRepository = (
  dependencies: Dependencies,
): BaseDynamoRepository => {
  const getInstanceResult = dependencies.dbManager.getInstance(
    DatabaseName.DYNAMO,
  )
  if (getInstanceResult.succeed === false) {
    throw new Result(
      false,
      'db dynamo connection failed',
      {},
      'DB_CONNECTION_ERROR',
      getInstanceResult,
    ).destroyToThrow()
  }
  return {
    getById: async (payload) => {
      try {
        const result = await getInstanceResult.data.send(
          new GetCommand({
            TableName: baseDynamoTable.TableName,
            Key: { id: payload.counterId },
          }),
        )

        if (result.Item === undefined) {
          return new Result(
            false,
            'db dynamo item not found',
            {},
            'DB_NOT_FOUND_ERROR',
          )
        }
        return new Result(
          true,
          'db dynamo item found',
          result.Item as { id: string; counter: number },
        )
      } catch (error) {
        return new Result(
          false,
          'db dynamo get failed',
          {},
          'DB_GET_ERROR',
          error,
        )
      }
    },
    createCounter: async ({ id, counter }) => {
      try {
        await getInstanceResult.data.send(
          new PutCommand({
            TableName: baseDynamoTable.TableName,
            Item: { id, counter },
          }),
        )
        return new Result(true, 'db dynamo item inserted', {})
      } catch (error) {
        return new Result(
          false,
          'db dynamo insert failed',
          {},
          'DB_INSERT_ERROR',
          error,
        )
      }
    },
  }
}
