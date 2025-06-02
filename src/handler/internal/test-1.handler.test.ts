import { expect, it } from 'vitest'
import type { InferHandlerPayloadType } from '../../shared/structure/handler.structure'
import { internalTest1Handler } from './test-1.handler'

type PrepareConfig = {
  payload: InferHandlerPayloadType<ReturnType<typeof internalTest1Handler>>
}

const prepare = (
  config: PrepareConfig,
): {
  config: PrepareConfig
  execute: ReturnType<typeof internalTest1Handler>['test']
  dependencies: any
} => {
  const dependencies = {}

  const handler = internalTest1Handler(dependencies as any)

  return {
    config,
    execute: handler.test,
    dependencies,
  }
}

it.skip('happy path: succeed', async () => {
  const test = prepare({
    payload: { counter: 1 },
  })

  const result = await test.execute(test.config.payload, {
    executionId: 'EXAMPLE_EXECUTION_ID',
  })

  expect(result.succeed).toStrictEqual(true)
  expect(result.errorName).toStrictEqual(undefined)
  expect(result.data).toStrictEqual({
    nextCounter: test.config.payload.counter + 1,
  })
})

it.skip('error path: counter error', async () => {
  const test = prepare({
    payload: { counter: -1 },
  })

  const result = await test.execute(test.config.payload, {
    executionId: 'EXAMPLE_EXECUTION_ID',
  })

  expect(result.succeed).toStrictEqual(false)
  expect(result.data).toStrictEqual(undefined)
  expect(result.errorName).toStrictEqual('HANDLER_INVALID_COUNTER_AMOUNT_ERROR')
})
