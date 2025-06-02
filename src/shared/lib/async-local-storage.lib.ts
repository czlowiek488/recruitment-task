import { AsyncLocalStorage } from 'async_hooks'

export type AuthAsyncLocalData = {
  executionId: string
}

export const asyncLocalStorage = new AsyncLocalStorage<AuthAsyncLocalData>()
