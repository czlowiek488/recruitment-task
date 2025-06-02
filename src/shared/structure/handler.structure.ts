import { v4 } from 'uuid'
import { stringifyError } from '../parser/stringify-error'
import type { AuthAsyncLocalData } from '../lib/async-local-storage.lib'
import { asyncLocalStorage } from '../lib/async-local-storage.lib'
import type { HandlerName } from '../enum/handler-name.enum'
import type { MergeUnion } from '../types/merge-union.type'
import { logger } from '../lib/logger.lib'
import type { Dependencies } from '../../app'
import { Result } from '../lib/result.lib'
import type { ErrorName } from '../lib/result.lib'

export type Handler<
  TPayload extends any,
  TResult extends Result<any, any, any, any, any>,
> = {
  name: string
  execute: (payload: TPayload) => Promise<TResult>
  test: (
    payload: TPayload,
    auth: AuthAsyncLocalData,
  ) => Promise<MergeUnion<TResult>>
}

export type InferHandlerPayloadType<THandler extends Handler<any, any>> =
  THandler extends Handler<infer UPayload, any> ? UPayload : never

export const createHandler =
  <
    TPayload extends any,
    TData extends { [key: string]: any },
    TError extends ErrorName,
  >(
    name: HandlerName,
    executor: (
      dependencies: Dependencies,
    ) => (
      payload: TPayload,
      auth: AuthAsyncLocalData,
    ) => Promise<
      Result<
        any,
        any,
        TData,
        | TError
        | 'HANDLER_ASYNC_LOCAL_STORE_DOES_NOT_EXISTS_ERROR'
        | 'HANDLER_EXECUTION_CAUGHT_ERROR',
        any
      >
    >,
  ): ((
    dependencies: Dependencies,
  ) => Handler<
    TPayload,
    Result<
      any,
      any,
      TData,
      | TError
      | 'HANDLER_ASYNC_LOCAL_STORE_DOES_NOT_EXISTS_ERROR'
      | 'HANDLER_EXECUTION_CAUGHT_ERROR',
      any
    >
  >) =>
  (dependencies: Dependencies) => {
    const execute = executor(dependencies)
    return {
      name,
      test: execute,
      execute: async (payload) => {
        const executionId = v4()
        logger.info(`Handler '${name}' started`, {
          name,
          executionId,
          payload,
        })
        try {
          const store = asyncLocalStorage.getStore()
          if (store === undefined) {
            return new Result(
              false,
              'handler async local store does not exists',
              {
                name,
                executionId,
                payload,
              },
              'HANDLER_ASYNC_LOCAL_STORE_DOES_NOT_EXISTS_ERROR',
            )
          }
          const result = await execute(payload, store)
          if (result.succeed === false) {
            logger.warning(`Handler '${name}' failed`, result.normalize())
            return result
          }
          logger.debug(`Handler '${name}' succeed`, result.normalize())
          return result
        } catch (error) {
          logger.error(`Handler '${name}' errored`, {
            name,
            executionId,
            payload,
            error: stringifyError(error),
          })
          return new Result(
            false,
            'handler execution error caught',
            { name, executionId, payload },
            'HANDLER_EXECUTION_CAUGHT_ERROR',
            error,
          )
        }
      },
    }
  }
