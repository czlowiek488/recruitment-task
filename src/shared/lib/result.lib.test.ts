/* eslint-disable no-restricted-globals */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, it } from 'vitest'
import { Result } from './result.lib'
import type { FunctionResult } from './result.lib'

// this file contains skipped tests, those tests should always be skipped, they are only to check types in convenient way

const testSimpleDataSingleErrorResultType = {} as FunctionResult<
  { some_data_1: string },
  'EXAMPLE_ERROR_NAME_1_ERROR'
>

const currentFilePath = import.meta.url.replace('file:///app', '')

it('simple data type passed correctly', () => {
  try {
    const _ =
      testSimpleDataSingleErrorResultType.data.some_data_1 === '123' ||
      //@ts-expect-error ---
      testSimpleDataSingleErrorResultType.data.some_data_1 === 123
  } catch {
    expect(true).toStrictEqual(true)
  }
})

it('error name can be only from provided type', () => {
  try {
    const _ =
      //@ts-expect-error ---
      testSimpleDataSingleErrorResultType.errorName === 'asdasd'
  } catch {
    expect(true).toStrictEqual(true)
  }
})

it('cause is optional', () => {
  try {
    const _ =
      //@ts-expect-error ---
      testSimpleDataSingleErrorResultType.cause.name
  } catch {
    expect(true).toStrictEqual(true)
  }
})

it('cannot access from outside of provided union', () => {
  try {
    const _ =
      testSimpleDataSingleErrorResultType.errorName ===
        'EXAMPLE_ERROR_NAME_1_ERROR' &&
      //@ts-expect-error ---
      testSimpleDataSingleErrorResultType.errorName ===
        'EXAMPLE_ERROR_NAME_2_ERROR'
  } catch {
    expect(true).toStrictEqual(true)
  }
})

const testUnionDataUnionErrorResultType = {} as FunctionResult<
  { some_data_1: string } | { some_data_2: number },
  'EXAMPLE_ERROR_NAME_1_ERROR'
>

it('data union type is not merged', () => {
  try {
    //@ts-expect-error ---
    const _ = testUnionDataUnionErrorResultType.data.some_data_2 === true
  } catch {
    expect(true).toStrictEqual(true)
  }
})

it('cannot access error name outside of provided union', () => {
  try {
    //@ts-expect-error ---
    const _ = test2.errorName === 'DB_InsertError'
  } catch {
    expect(true).toStrictEqual(true)
  }
})

it('result is created with correct instance - result', () => {
  const result = new Result(true, 'example result message 3', {})

  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    message: 'example result message 3',
    parent: null,
    id: expect.any(String),
    succeed: true,
    data: {},
    executionId: undefined,
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    errorCause: undefined,
    causeList: [Result.normalizeCause(result)],
    name: 'Succeed',
    stack: expect.any(String),
  })
})

it('result is created with correct instance - error - source cause is source', () => {
  const result = new Result(
    false,
    'example error message 1',
    {},
    'EXAMPLE_ERROR_NAME_1_ERROR',
  )

  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    message: 'example error message 1',
    parent: null,
    id: expect.any(String),
    succeed: false,
    errorCause: undefined,
    executionId: undefined,
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    data: {},
    causeList: [Result.normalizeCause(result)],
    name: 'EXAMPLE_ERROR_NAME_1_ERROR',
    stack: expect.any(String),
  })
})

type ObjectWithSingleFunctionType = {
  testFunction: () => FunctionResult<{}, 'EXAMPLE_ERROR_NAME_1_ERROR'>
}

it('test object implementation - alone - types - invalid error name ', () => {
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      //@ts-expect-error ---
      new Result(
        false,
        'db mongo connection failed',
        {},
        //@ts-expect-error ---
        'INVALID_ERROR_NAME',
      ),
  }
})

it('test object implementation - alone - data', () => {
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () => new Result(true, 'example result message 1', {}),
  }

  const result = testObject.testFunction()

  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    message: 'example result message 1',
    parent: null,
    id: expect.any(String),
    succeed: true,
    executionId: undefined,
    data: {},
    errorCause: undefined,
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    causeList: [Result.normalizeCause(result)],
    name: 'Succeed',
    stack: expect.any(String),
  })
})

it('test object implementation -- cause result - types - invalid error name', () => {
  const cause = new Result(true, 'example result message 1', {})
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      //@ts-expect-error ---
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_2_ERROR',
        cause,
      ),
  }
})

it('test object implementation -- cause result - data', () => {
  const cause = new Result(true, 'example result message 1', {})
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_1_ERROR',
        cause,
      ),
  }
  const result = testObject.testFunction()

  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    id: expect.any(String),
    message: 'example error message 1',
    name: 'EXAMPLE_ERROR_NAME_1_ERROR',
    parent: Result.normalizeCause(cause),
    executionId: undefined,
    stack: expect.any(String),
    data: {},
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    errorCause: Result.normalizeCause(cause),
    succeed: false,
    causeList: [Result.normalizeCause(result), Result.normalizeCause(cause)],
  })
})

it('test object implementation - cause error - types - invalid error name', () => {
  const cause = new Error('some funny message')
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      //@ts-expect-error ---
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_2_ERROR',
        cause,
      ),
  }
})

it('test object implementation - cause error - data', () => {
  const cause = new Error('some funny message')
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_1_ERROR',
        cause,
      ),
  }
  const result = testObject.testFunction()

  expect(new Error()).not.toBeInstanceOf(Result)
  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    id: expect.any(String),
    message: 'example error message 1',
    name: 'EXAMPLE_ERROR_NAME_1_ERROR',
    parent: null,
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    executionId: undefined,
    stack: expect.any(String),
    data: {},
    errorCause: Result.normalizeCause(cause),
    succeed: false,
    causeList: [Result.normalizeCause(result), Result.normalizeCause(cause)],
  })
})

it('test object implementation - cause dummy object - types - invalid error name', () => {
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      //@ts-expect-error ---
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_2_ERROR',
        {
          dummy_object: 'data',
        },
      ),
  }
})

it('test object implementation - cause dummy object - data', () => {
  const cause = { dummy_object: 'data' }
  const testObject: ObjectWithSingleFunctionType = {
    testFunction: () =>
      new Result(
        false,
        'example error message 1',
        {},
        'EXAMPLE_ERROR_NAME_1_ERROR',
        {
          dummy_object: 'data',
        },
      ),
  }
  const result = testObject.testFunction()

  expect(result).toBeInstanceOf(Error)
  expect(result).toBeInstanceOf(Result)
  expect(result.normalize()).toStrictEqual({
    id: expect.any(String),
    message: 'example error message 1',
    name: 'EXAMPLE_ERROR_NAME_1_ERROR',
    path: expect.stringMatching(`${currentFilePath}:*:*`),
    parent: null,
    executionId: undefined,
    stack: expect.any(String),
    data: {},
    errorCause: Result.normalizeCause(cause),
    succeed: false,
    causeList: [Result.normalizeCause(result), Result.normalizeCause(cause)],
  })
})
