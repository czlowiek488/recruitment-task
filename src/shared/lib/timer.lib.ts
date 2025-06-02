import { ConstantBackoff, RetryPolicy } from 'cockatiel'

import { ExecuteWrapper } from 'cockatiel/dist/common/Executor.js'
import { Result } from './result.lib'
import type { FunctionResult } from './result.lib'

type CockatielTimer = (config: {
  maxDuration: number
  delay: number
  check: () => Promise<boolean> | boolean
}) => FunctionResult<
  Promise<{}>,
  'TIMER_CHECK_FUNCTION_ERROR' | 'TIMER_TIMEOUT_ERROR'
>

export const cockatielTimer: CockatielTimer = async (payload) => {
  const maxAttempts = Math.ceil(payload.maxDuration / payload.delay)

  const retryPolicy = new RetryPolicy(
    {
      backoff: new ConstantBackoff(payload.delay),
      maxAttempts,
      unref: false,
    },
    new ExecuteWrapper(
      () => true,
      () => false,
    ),
  )

  try {
    await retryPolicy.execute(async () => {
      const result = await payload.check()
      if (result === false) {
        // eslint-disable-next-line no-restricted-globals
        throw new Error('retry') // force retry
      }
    })
    return new Result(true, 'timer execution finished', {})
  } catch (err) {
    // eslint-disable-next-line no-restricted-globals
    if (err instanceof Error && err.message !== 'retry') {
      return new Result(
        false,
        'timer execution check function failed',
        {},
        'TIMER_CHECK_FUNCTION_ERROR',
      )
    }
    return new Result(
      false,
      'timer execution timeout',
      {},
      'TIMER_TIMEOUT_ERROR',
    )
  }
}
