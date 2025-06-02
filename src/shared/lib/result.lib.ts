import { v4 } from 'uuid'
import type { DatabaseName } from '../enum/database-name.enum'
import type { EndpointName } from '../structure/endpoint.structure'
import { asyncLocalStorage } from './async-local-storage.lib'
import { logger, LoggingFileNames } from './logger.lib'
import { secureJsonStringify } from '../parser/secure-json.parser'
import { AxiosError } from 'axios'
import { parseAxiosError } from '../parser/remove-circular.parser'
import type { HandlerName } from '../enum/handler-name.enum'
import type { RemoveUnderscore } from '../types/remove-underscore.type'

type DbOperation =
  | 'get'
  | 'insert'
  | 'connection'
  | 'disconnection'
  | 'emptying'
  | 'migration'

/* eslint-disable no-restricted-globals */
export type ResultMessage = Lowercase<
  | `example result message ${number}`
  | `server ${'closed' | `awaiting uncompleted requests finished`}`
  | `${'db' | 'manager db'} ${'migration succeed' | `${DatabaseName | ''} ${'migration table description obtained' | `instance got` | 'emptying completed' | 'connected' | 'disconnected' | 'migration finished' | `item ${'found' | 'inserted' | 'connected'}`}`}`
  | `example ${number}`
  | `integration ${'request succeed'}`
  | `timer execution finished`
  | `test assure config ${'no difference' | 'app reloaded'}`
  | 'config logic validation succeed'
  // handler
  | `handler ${RemoveUnderscore<HandlerName>} succeed`
  // container
  | 'container loading succeed'
  // server
  | `server ${`listening ${'starting' | 'stopping'}` | `awaiting uncompleted requests`} succeed`
  // endpoint
  | 'endpoint request succeed'
  // config
  | 'config loaded'
  // manager db
  | 'manager db database does not have migration function'
  | `manager db ${'getting connection status' | 'migrating' | 'get host names' | 'emptying' | 'disconnection' | 'connection' | `for each ${'local' | 'global'}`} succeed`
  | `manager db ${'implementation does not have migration function' | 'host name found'}`
  // manager app
  | `manager app ${'reloading' | 'closing' | 'starting'} succeed`
  // route
  | `route succeed`
>

export type ErrorMessage = Lowercase<
  | `server ${`awaiting uncompleted requests timeout` | 'unexpectedly is not listening'}`
  | `example error message ${number}`
  | `${'db' | 'manager db'} ${
      | `${'emptying' | 'migration' | 'connecting'} failed unexpectedly`
      | 'migration errored'
      | 'unsupported type'
      | `dynamo table ${'config missing' | `${'creating' | 'describing'} failed`}`
      | `${DatabaseName | ''} ${`${DbOperation} failed` | 'already connected' | `item not found` | 'not connected' | 'emptying disallowed'}`}`
  | `integration ${'could not send request because of network failure'}`
  | `timer execution ${'check function failed' | 'timeout'}`
  | `endpoint ${'mock execution' | 'request'} failed`
  | `handler ${'async local store does not exists' | `execution failed` | 'execution error caught' | 'invalid counter amount' | `${EndpointName | 'create counter'} failed`}`
  | `route ${
      | 'not found'
      | `request ${'validation failed' | 'failed with unexpected error' | 'error handler failed'}`}`
  // test
  | `test ${'execution' | 'assuring config'} failed`
  // route
  | 'route did not handled an error'
  // config
  | 'config validation failed'
  // server
  | 'server listening started failed'
  // container
  | 'container loading failed'
  // app
  | 'app loading failed'
  // manager db
  | `manager db ${'connection' | 'disconnection' | 'emptying' | 'initializing' | `for each ${'global' | 'local'}`} failed`
  // manager app
  | `manager app ${'loading' | 'starting' | 'closing' | 'reloading'} failed`
>
export type ErrorName = Uppercase<`${
  // example
  | `EXAMPLE_ERROR_NAME_${number}`
    // test
    | `TEST_${'ASSURING_CONFIG' | 'EXECUTION'}`
    //integration
    | `INTEGRATION_${'INVALID_STATUS_CODE' | 'CONNECTION'}`
    // timer
    | `TIMER_${'CHECK_FUNCTION' | 'TIMEOUT'}`
    // db
    | `DB_${`${DbOperation | 'NOT_FOUND' | 'NOT_CONNECTED' | 'ALREADY_CONNECTED' | 'EMPTYING_DISALLOWED'}` | 'UNSUPPORTED_TYPE'}`
    // endpoint
    | `ENDPOINT_${'MOCK_EXECUTION' | 'REQUEST'}`
    // handler
    | `HANDLER_${`EXECUTION${'' | '_CAUGHT'}` | 'ASYNC_LOCAL_STORE_DOES_NOT_EXISTS' | 'GET_COUNTER' | 'PERFORMANCE_TEST' | 'INVALID_COUNTER' | 'CREATE_COUNTER'}`
    // route
    | `ROUTE_REQUEST_${'VALIDATION' | 'UNEXPECTED'}`
    | 'ROUTE_ENDPOINT_NOT_FOUND'
    | 'ROUTE_UNHANDLED'
    // app
    | `APP_${'LOADING' | 'RELOADING' | 'STARTING' | 'CLOSING'}`
    // server
    | `SERVER_${'AWAITING_UNCOMPLETED_REQUESTS_TIMEOUT' | `${'NOT_' | ''}LISTENING`}`
    // config
    | 'CONFIG_VALIDATION'
    // container
    | 'CONTAINER_LOADING'
    // manager db
    | `DB_MANAGER_${'INITIALIZATION' | 'GETTING_HOST_NAMES' | 'MIGRATION' | 'EMPTYING' | 'CONNECTION' | `FOR_EACH_${'LOCAL' | 'GLOBAL'}`}`
}_ERROR`>
type Cause =
  | Result<true, ResultMessage, any, never, never>
  | Result<false, ErrorMessage, any, ErrorName, Cause>
  | Error
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  | unknown

export type FunctionResult<TData extends any, TErrorName extends ErrorName> =
  TData extends Promise<any>
    ? Promise<Result<boolean, ResultMessage, Awaited<TData>, TErrorName, any>>
    : Result<boolean, ResultMessage, TData, TErrorName, any>

export type MergeResult<T extends Result<any, any, any, any, any>> =
  T extends Result<true, infer M, infer D, never, never>
    ? {
        succeed: true
        message: M
        data: D
        error: {
          name: 'NO_ERROR'
          message: ''
        }
      }
    : T extends Result<false, infer M, infer D, infer EN, infer EC>
      ? {
          succeed: false
          message: M
          data: D
          error: {
            name: EN
            message: M
            cause: EC
          }
        }
      : never

// error is extended to get stack trace of the place of creation of the Result
// also usage of error allow to treat Result both as an error and as Succeedful result
export class Result<
  TSucceed extends boolean,
  TMessage extends TSucceed extends true ? ResultMessage : ErrorMessage,
  TData extends any,
  TErrorName extends TSucceed extends true ? never : ErrorName,
  TErrorCause extends TSucceed extends true ? never : Cause,
> extends Error {
  private causeList: Cause[] = []
  private parent: Result<any, any, any, any, any> | null = null
  private id: string = v4()
  private executionId: string | undefined =
    asyncLocalStorage.getStore()?.executionId
  private path: string | null = null

  private static getErrorOriginLine(stack: string | undefined): string | null {
    if (stack === undefined) {
      return null
    }
    for (const line of stack.split('\n')) {
      const match =
        line.match(/\((\/.*:\d+:\d+)\)/) || line.match(/at (\/.*:\d+:\d+)/)
      if (match) {
        return match?.[1]?.trim().replace('/app', '') || null
      }
    }
    return null
  }

  constructor(succeed: true, message: ResultMessage, data: TData)
  constructor(
    succeed: false,
    message: ErrorMessage,
    data: any,
    errorName: TErrorName,
    errorCause?: TErrorCause,
  )
  constructor(
    public succeed: TSucceed,
    public message: TMessage,
    public data: TData,
    public errorName?: TErrorName,
    public errorCause?: TErrorCause,
  ) {
    super(message, { cause: errorCause })
    this.name =
      this.succeed === false ? errorName || 'MISSING_ERROR_NAME' : `Succeed`

    this.path = Result.getErrorOriginLine(this.stack)

    if (this.errorCause === undefined) {
      this.causeList.push(this)
    } else if (this.errorCause instanceof Result) {
      this.causeList.push(this, ...this.errorCause.causeList)
      this.parent = this.errorCause || null
    } else {
      this.causeList.push(this, this.errorCause)
    }
    if (this.succeed === true) {
      logger.info(`Result> ${this.name}: ${this.message}`, {
        data: this.data,
      })
    } else {
      const lastCause = this.causeList.at(-1)
      logger.warning(
        `Error#${this.errorName}> ${this.name}: ${this.message} -> [${this.getCauseNameList().reverse().join(', ')}]${this.path === null ? '' : ` --> ${this.path}`}${
          lastCause !== undefined && lastCause instanceof Error
            ? `\n ${lastCause.stack}`
            : ''
        }`,
        {},
        { file: LoggingFileNames.RESULT },
      )
    }
  }

  public normalize(root: boolean = true): {
    stack?: string
    path: string | null
    message: string
    succeed: boolean
    data: any
    errorName?: string
    errorCause?: Cause
    name: string
    id: string
    executionId: string | undefined
    parent: any
    causeList: Cause[]
  } {
    return {
      name: this.name,
      message: this.message,
      path: this.path,
      succeed: this.succeed,
      data: this.data,
      errorCause:
        this.errorCause === undefined || root === false
          ? undefined
          : Result.normalizeCause(this.errorCause),
      parent: root === false ? null : this.parent?.normalize(false) || null,
      causeList:
        root === true ? this.normalizeCauseList() : this.getCauseNameList(),
      executionId: this.executionId,
      id: this.id,
      stack: this.stack,
    }
  }

  public static normalizeCause(cause: Cause) {
    if (cause instanceof Result) {
      return cause.normalize(false)
    } else if (cause instanceof AxiosError) {
      return parseAxiosError(cause)
    } else if (cause instanceof Error) {
      return {
        name: cause.name,
        message: cause.message,
        stack: cause.stack,
      }
    }
    return secureJsonStringify(cause)
  }

  public normalizeCauseList() {
    return this.causeList.map((cause) => Result.normalizeCause(cause))
  }

  public getCauseNameList(): string[] {
    return this.causeList.map((value: any) =>
      'name' in value && typeof value.name === 'string' ? value.name : '???',
    )
  }

  public toLog() {
    return this.normalizeCauseList()
  }

  public destroyToThrow() {
    return Object.assign(
      new Error(),
      { stack: this.stack, name: this.name },
      this.normalizeCauseList(),
    )
  }
}
