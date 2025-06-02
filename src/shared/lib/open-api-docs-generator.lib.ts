import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import type { ReplyBody, Scope } from 'nock'
import type { StatusCodes } from 'http-status-codes'
import { HTTPMethod } from 'http-method-enum'
import { DateTime } from 'luxon'
// TODO toJsonSchema does not work as expected in corner cases, in order to make fit all corner cases own implementation is required
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { logger } from './logger.lib'
import { envVariables } from './dotenv.lib'
import { prettyJsonParser } from '../parser/pretty-json.parser'
import type { EndpointName } from '../structure/endpoint.structure'
import type { RouteName } from '../enum/route-name.enum'

export type NockScopeUrlParts = {
  hash: string
  host: string
  hostname: string
  href: string
  origin: string
  password: string
  pathname: string
  port: number
  protocol: string
  search: string
  searchParams: { [key: string]: any }
  username: string
}

export type NockScope = {
  urlParts: NockScopeUrlParts
}

export type OpenApiGeneratorState = {
  initializedAt: string
  counter: number
}

export type StoredDataHeaders = {
  [key: string]: string | string[]
}

export type StoredData = {
  timestamp: string
  endpointName: string
  state: OpenApiGeneratorState
  jest: {
    currentTestName: string
    currentConcurrentTestName?: string
    testPath: string
  }
  request: {
    topLevelDomain: string
    normalizedPath: string
    host: string
    path: string
    protocol: string
    port: number
    method: HTTPMethod
    headers: StoredDataHeaders
    query: { [key: string]: any }
    parsedBody: { [key: string]: any }
    originalBody: string | { [key: string]: any }
  }
  response: {
    statusCode: StatusCodes
    body?: ReplyBody
    headers?: StoredDataHeaders
  }
}

export const abortTestsWithError = (payload: {
  message: string
  data: any
}): never => {
  logger.crit(payload.message, payload.data)
  // eslint-disable-next-line no-restricted-globals
  process.exit(1)
}

export type Replacer = {
  pattern: Parameters<string['replaceAll']>[0]
  type: OpenAPIV3.NonArraySchemaObjectType
  example: OpenAPIV3_1.ExampleObject
  description: string
}

export const directoryPathReplacerList: {
  [key: string]: Replacer
} = {
  // '{UUID:V4}': {
  //   pattern:
  //     /[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/g,
  //   type: 'string',
  //   description: 'string representing uuid v4',
  //   example: {
  //     value: '5c37076e-3f9e-457a-b804-ce31390c5dcc',
  //     summary: 'random uuid string',
  //   },
  // },
  // '{Date:Readable}': {
  //   pattern:
  //     /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/g,
  //   type: 'string',
  //   description: 'some readable date',
  //   example: {
  //     value: 'Sun, 01 Jun 2025 20:07:21 GMT',
  //     summary: 'some date in readable format',
  //   },
  // },
}

export const replacerToOpenApi = (
  replacer: Replacer,
): Pick<OpenAPIV3.NonArraySchemaObject, keyof Replacer> => ({
  example: replacer.example,
  description: replacer.description,
  type: replacer.type,
  pattern: replacer.pattern.toString(),
})

export const normalizeString = (str: string) =>
  Object.entries(directoryPathReplacerList).reduce(
    (path, [replaceValue, { pattern: regexp }]) =>
      path.replaceAll(regexp, replaceValue),
    str,
  )

export const normalizeObjectStrings = (input: any): any => {
  if (typeof input === 'string') {
    return normalizeString(input)
  }

  if (Array.isArray(input)) {
    return input.map(normalizeObjectStrings)
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) =>
        key === 'stack'
          ? [key, '{STACK}']
          : [key, normalizeObjectStrings(value)],
      ),
    )
  }

  // Return other types (number, boolean, null, undefined) as-is
  return input
}

export const createDirectoryPath = (payload: StoredData): string => {
  const testFilename = payload.jest.testPath.split('/').at(-1)?.split('.').at(0)
  return `${payload.state.initializedAt}-${testFilename}/${payload.request.topLevelDomain}/${
    payload.request.host
  }/${payload.request.normalizedPath.replaceAll('/', '-')}`
}

const getNestedObjectKeys = (val: any): string[] =>
  val === null
    ? []
    : Object.entries(val).reduce((acc, [key, value]) => {
        if (typeof value !== 'object') {
          return [...acc, key]
        }
        return [...acc, key, ...getNestedObjectKeys(value)]
      }, [] as string[])

export const makeStoredData = async (
  payload: { state: OpenApiGeneratorState } & StoreRequestDataPayload,
): Promise<StoredData> => {
  const { expect } = await import('vitest')
  const testState = expect.getState()
  if (
    testState.currentTestName === undefined ||
    testState.testPath === undefined
  ) {
    return abortTestsWithError({
      message:
        'jestState does not have required properties - generator can extract test data only if test is running!',
      data: testState,
    })
  }
  if (
    payload.response.headers !== undefined &&
    (payload.response.headers instanceof Array ||
      payload.response.headers instanceof Map ||
      Object.values(payload.response.headers).some(
        (value) => value instanceof Array || typeof value === 'function',
      ))
  ) {
    return abortTestsWithError({
      message: 'request contain invalid payload.response.headers',
      data: { payload, jestState: testState },
    })
  }
  return {
    state: payload.state,
    timestamp: payload.timestamp,
    endpointName: payload.configuration.endpoint,
    jest: {
      currentTestName: testState.currentTestName,
      currentConcurrentTestName: testState.currentTestName, //todo check is it work with concurrent tests
      testPath: testState.testPath,
    },
    request: {
      normalizedPath: normalizeString(
        payload.configuration.path.replace('/', ''),
      ),
      topLevelDomain: payload.request.urlParts.host.split('.').at(-1)!,
      host: payload.request.urlParts.host.split('.').slice(0, -1).join('.'),
      path: payload.configuration.path,
      protocol: payload.request.urlParts.protocol,
      port: payload.request.urlParts.port,
      method: payload.request.method.toUpperCase() as HTTPMethod,
      headers: Object.fromEntries(
        Object.entries(payload.request.headers).map(
          ([headerKey, headerValue]) => [
            headerKey.toLowerCase(),
            headerValue instanceof Array
              ? headerValue.map(normalizeString)
              : normalizeString(headerValue),
          ],
        ),
      ) as StoredDataHeaders,
      query: payload.configuration.query || {},
      parsedBody: payload.request.parsedBody,
      originalBody: normalizeObjectStrings(payload.request.originalBody),
    },
    response: {
      statusCode: payload.response.statusCode,
      body: payload.response.body,
      headers: payload.response.headers,
    },
  }
}
export type Parameter = {
  parameterName: string
  replacer: (typeof directoryPathReplacerList)[keyof typeof directoryPathReplacerList] & {
    name: keyof typeof directoryPathReplacerList
  }
}

export type PathReplacedAndParameterReplacers = {
  path: string
  parameterList: Parameter[]
}

export type GroupedStoredDataByContentType = {
  [contentType: string]: StoredData[]
}
export type GroupedStoredDataByMethod = {
  [method in HTTPMethod]: GroupedStoredDataByContentType
}
export type GroupedStoredDataByUrlItem = {
  parameterList: Parameter[]
  data: GroupedStoredDataByMethod
}
export type GroupedStoredDataByUrl = {
  [url: string]: GroupedStoredDataByUrlItem
}

export const createOpenApiExamples = <TArrayElement extends any>(
  array: TArrayElement[],
  mapper: (payload: TArrayElement) => OpenAPIV3_1.ExampleObject,
): { [exampleName: string]: OpenAPIV3_1.ExampleObject } =>
  Object.fromEntries(
    array.map((element, index): [string, OpenAPIV3_1.ExampleObject] => [
      `example#${index}`,
      mapper(element),
    ]),
  )

function inferTupleAwareSchema(value: any): any {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      prefixItems: value.map(inferTupleAwareSchema),
    }
  }

  if (value === null) return { type: 'null' }

  const type = typeof value

  if (type === 'string') return { type: 'string' }
  if (type === 'number') return { type: 'number' }
  if (type === 'boolean') return { type: 'boolean' }

  if (type === 'object') {
    const properties: Record<string, any> = {}
    const required: string[] = []

    for (const key in value) {
      properties[key] = inferTupleAwareSchema(value[key])
      required.push(key)
    }

    return {
      type: 'object',
      properties,
      required,
    }
  }

  return {}
}

//! This function results with not user friendly openapi output - for each different key in arrayElement new schema is created
export const generateOpenApiSchemaAndExamples = <TArrayElement extends any>(
  array: TArrayElement[],
  accessor?: (payload: TArrayElement) => any,
): {
  schema: OpenAPIV3_1.SchemaObject
  examples: { [exampleName: string]: OpenAPIV3_1.ExampleObject }
} | null => {
  logger.info('open api docs schema and examples generating...')
  const realAccessor = (data: any) =>
    accessor !== undefined ? accessor(data) : data
  // new schema is generated for each different key in response.body, object should be merged and keys which exists in every body should be marked as required
  // it is causing multiple examples/schemas for each object, maybe it will be a good idea to write own json to jsonSchema script to handle those scenarios
  const arrayFilteredByNestedKeys = array.filter(
    (valueA, index, self) =>
      self.findIndex(
        (valueB) =>
          getNestedObjectKeys(realAccessor(valueA)).sort().join('.') ===
          getNestedObjectKeys(realAccessor(valueB)).sort().join('.'),
      ) === index,
  )
  const data = arrayFilteredByNestedKeys.map(realAccessor)
  logger.error('data', data)
  const contentSchema = inferTupleAwareSchema(data)
    .prefixItems as OpenAPIV3_1.SchemaObject[]

  if (contentSchema === undefined || contentSchema.length === 0) {
    logger.warning('open api docs schema and examples generated - no schema')
    return null
  }
  const result = {
    schema:
      contentSchema.length === 1
        ? (contentSchema[0] as OpenAPIV3_1.SchemaObject)
        : {
            oneOf: contentSchema.map((schema, index) => ({
              ...schema,
              title: `schema#${index}`,
            })),
          },
    examples: createOpenApiExamples(arrayFilteredByNestedKeys, (element) => ({
      value: realAccessor(element),
    })),
  }
  logger.info('open api docs schema and examples generated - schema builded')

  return result
}

export const generateOpenApiHeaderObject = <
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  TArrayElement extends { [key: string]: StoredDataHeaders | any },
>(payload: {
  array: TArrayElement[]
  accessor?: (payload: TArrayElement) => StoredDataHeaders
  skippedHeaderList: string[]
}):
  | {
      [headerName: string]: Pick<OpenAPIV3_1.HeaderObject, 'schema'> & {
        examples: { [key: string]: OpenAPIV3_1.ExampleObject }
      }
    }
  | undefined => {
  const realAccessor = (data: any): StoredDataHeaders =>
    payload.accessor !== undefined ? payload.accessor(data) : data
  const groupedByHeaderName = payload.array.reduce(
    (acc, storedData) => {
      Object.entries(realAccessor(storedData)).forEach(
        ([headerName, headerValue]) => {
          if (payload.skippedHeaderList.includes(headerName)) {
            return
          }
          if (acc[headerName] === undefined) {
            acc[headerName] = []
          }
          if (headerValue instanceof Array) {
            acc[headerName].push(...headerValue)
          } else {
            acc[headerName].push(headerValue)
          }
        },
      )
      return acc
    },
    {} as { [headerName: string]: string[] },
  )
  const openApiResponseHeaders = Object.entries(groupedByHeaderName).map(
    ([headerName, headerValues]) => [
      headerName,
      generateOpenApiSchemaAndExamples(headerValues),
    ],
  )
  if (openApiResponseHeaders.length === 0) {
    return undefined
  }
  return Object.fromEntries(openApiResponseHeaders)
}

export const getPathReplacedAndParameterReplacers = (payload: {
  normalizedPath: string
}) => {
  logger.info(
    'open api docs path and parameter replacers generating...',
    payload,
  )
  const result = Object.keys(directoryPathReplacerList)
    .reduce(
      (accReplaces, replacer) => {
        Array.from({
          length: payload.normalizedPath.split(replacer).length - 1,
        }).reduce((accNormalizedPath: string) => {
          const index = accNormalizedPath.indexOf(replacer)
          accReplaces.push({
            replacer,
            index:
              index + payload.normalizedPath.length - accNormalizedPath.length,
            replacerName: replacer,
          })
          return accNormalizedPath.slice(index + replacer.length)
        }, payload.normalizedPath)
        return accReplaces
      },
      [] as { replacerName: string; replacer: string; index: number }[],
    )
    .sort((a, b) => a.index - b.index)
    .reduce(
      (acc, one, index) => {
        const parameterName = `pathParameter#${index + 1}`
        return {
          path: acc.path.replace(one.replacer, `{${parameterName}}`),
          parameterList: [
            ...acc.parameterList,
            {
              parameterName,
              replacer: {
                ...directoryPathReplacerList[one.replacer],
                name: one.replacerName,
              },
            },
          ],
        } as PathReplacedAndParameterReplacers
      },
      {
        path: payload.normalizedPath,
        parameterList: [],
      } as PathReplacedAndParameterReplacers,
    )
  logger.info('open api docs path and parameter replacers generated')
  return result
}

export const groupStoredData = (payload: {
  storedDataList: StoredData[]
}): GroupedStoredDataByUrl => {
  logger.info('open api docs stored data grouping...')
  const result = payload.storedDataList.reduce((acc, file) => {
    const newPathWithReplacers = getPathReplacedAndParameterReplacers({
      normalizedPath: file.request.normalizedPath,
    })
    const url = `/${file.request.topLevelDomain}${file.request.host}/${newPathWithReplacers.path}/`
    if (acc[url] === undefined) {
      acc[url] = {
        parameterList: newPathWithReplacers.parameterList,
        data: Object.fromEntries(
          Object.values(HTTPMethod).map(
            (method) =>
              [method, {}] as [HTTPMethod, GroupedStoredDataByContentType],
          ),
        ) as GroupedStoredDataByMethod,
      }
    }
    acc[url].parameterList = [
      ...acc[url].parameterList,
      ...newPathWithReplacers.parameterList,
    ].filter(
      (parameter, index, arr) =>
        arr.findIndex(
          (value) => value.replacer.name === parameter.replacer.name,
        ) === index,
    )
    const contentTypeHeader =
      file.request.headers['content-type'] || 'application/json'
    if (
      acc[url].data[file.request.method][contentTypeHeader.toString()] ===
      undefined
    ) {
      acc[url].data[file.request.method][contentTypeHeader.toString()] = []
    }
    acc[url].data[file.request.method][contentTypeHeader.toString()]!.push(file)
    return acc
  }, {} as GroupedStoredDataByUrl)

  logger.info('open api docs stored data grouped')
  return result
}

export const getRequestBodySchemaEntries = (payload: {
  group: GroupedStoredDataByContentType
  method: HTTPMethod
}) => {
  logger.info('open api docs request body schema entries generating...', {
    method: payload.method,
  })
  const result = Object.entries(payload.group).map(
    ([contentType, storedDataList]) => {
      if (payload.method === HTTPMethod.GET && contentType === 'undefined') {
        return []
      }
      const openApiRequestBody = generateOpenApiSchemaAndExamples(
        storedDataList.filter(
          (storedData) => storedData.request.parsedBody !== undefined,
        ),
        (storedData) => storedData.request.parsedBody,
      )
      if (openApiRequestBody === null) {
        return []
      }
      return [contentType, openApiRequestBody]
    },
  )
  logger.info('open api docs request body schema entries generated', {
    method: payload.method,
  })
  return result
}

export const getOpenApiResponsesSchemaEntries = (payload: {
  group: GroupedStoredDataByContentType
  skippedHeaderList: string[]
}): [
  keyof OpenAPIV3_1.ResponsesObject,
  OpenAPIV3_1.ResponsesObject[keyof OpenAPIV3_1.ResponsesObject],
][] => {
  const storedDataGroupedByStatusCodes = Object.values(payload.group)
    .flat()
    .reduce(
      (acc, storedData) => {
        if (acc[storedData.response.statusCode] === undefined) {
          acc[storedData.response.statusCode] = []
        }
        acc[storedData.response.statusCode]!.push(storedData)
        return acc
      },
      {} as { [key: string]: StoredData[] },
    )
  return Object.entries(storedDataGroupedByStatusCodes).map(
    ([statusCode, storedDataList]): [string, OpenAPIV3_1.ResponseObject] => {
      const response: OpenAPIV3_1.ResponseObject = {
        description: `response when api returns ${statusCode} statusCode`,
      }
      const openApiResponseContent = generateOpenApiSchemaAndExamples(
        storedDataList.filter(
          (storedData) => storedData.response.body !== undefined,
        ),
        (storedData) => storedData.response.body!,
      )
      if (openApiResponseContent !== null) {
        response.content = {
          // HARDCODED application/json response type because of lack of response headers in nock mocks
          'application/json': openApiResponseContent,
        }
      }
      const openApiHeaderObject = generateOpenApiHeaderObject({
        array: storedDataList.filter(
          (storedData) => storedData.response.headers !== undefined,
        ),
        accessor: (storedData) => storedData.response.headers!,
        skippedHeaderList: payload.skippedHeaderList,
      })
      if (openApiHeaderObject !== undefined) {
        response.headers = openApiHeaderObject
      }
      return [statusCode, response]
    },
  )
}

export const getOpenApiSchemaEntriesPerMethod = (payload: {
  groupedStoredDataByMethod: GroupedStoredDataByMethod
  skippedHeaderList: string[]
}): [string, OpenAPIV3_1.OperationObject][] => {
  logger.info('openapi docs schema entries per method generating...')
  const result = Object.entries(payload.groupedStoredDataByMethod).map(
    ([method, group]: [string, GroupedStoredDataByContentType]) => {
      const schema: OpenAPIV3_1.OperationObject = {}
      const requestBodySchemaEntries = getRequestBodySchemaEntries({
        group,
        method: method as HTTPMethod,
      })
      if (requestBodySchemaEntries.length > 0) {
        schema.requestBody = {
          content: Object.fromEntries(requestBodySchemaEntries),
        }
      }
      const responsesSchemaEntries = getOpenApiResponsesSchemaEntries({
        group,
        skippedHeaderList: payload.skippedHeaderList,
      })
      if (responsesSchemaEntries.length > 0) {
        schema.responses = Object.fromEntries(responsesSchemaEntries)
      }
      const openApiHeadersObject = generateOpenApiHeaderObject({
        array: Object.values(group)
          .flat()
          .filter((storedData) => storedData.request.headers !== undefined),
        accessor: (storedData) => storedData.request.headers,
        skippedHeaderList: payload.skippedHeaderList,
      })
      logger.debug('schema.parameters', schema.parameters)
      if (openApiHeadersObject !== undefined) {
        if (schema.parameters === undefined) {
          schema.parameters = []
        }
        schema.parameters = [
          ...schema.parameters,
          ...Object.entries(openApiHeadersObject).reduce(
            (acc, [headerName, headerSchema]) => {
              if (headerSchema.schema === undefined) {
                return acc
              }
              if (headerSchema.examples === undefined) {
                acc.push({
                  in: 'header',
                  name: headerName,
                  schema: headerSchema.schema,
                })
              } else if (Object.keys(headerSchema.examples).length === 1) {
                acc.push({
                  in: 'header',
                  name: headerName,
                  schema: headerSchema.schema,
                  example: Object.values(headerSchema.examples)[0]!.value,
                })
              } else {
                acc.push({
                  in: 'header',
                  name: headerName,
                  schema: headerSchema.schema,
                  examples: headerSchema.examples,
                })
              }
              return acc
            },
            [] as OpenAPIV3_1.ParameterObject[],
          ),
        ]
      }
      return [method.toLowerCase() as Lowercase<HTTPMethod>, schema]
    },
  )

  logger.info('openapi docs schema entries per method generated')
  return result as any
}

export const mapParameterListToOpenApiParameters = (payload: {
  parameterList: PathReplacedAndParameterReplacers['parameterList']
  in: 'path' | 'query' | 'headers'
}): OpenAPIV3_1.ParameterObject[] => {
  const parameterReplacersGroupedByParameterName = payload.parameterList.reduce(
    (acc, pathParameter) => {
      if (acc[pathParameter.parameterName] === undefined) {
        acc[pathParameter.parameterName] = []
      }
      acc[pathParameter.parameterName]!.push(pathParameter.replacer)
      return acc
    },
    {} as {
      [
        parameterName: string
      ]: PathReplacedAndParameterReplacers['parameterList'][number]['replacer'][]
    },
  )
  return Object.entries(parameterReplacersGroupedByParameterName).reduce(
    (acc, [parameterName, replacerList]) => {
      if (replacerList.length === 0) {
        return acc
      }
      if (replacerList.length === 1) {
        acc.push({
          in: payload.in,
          name: parameterName,
          required: true,
          examples: Object.fromEntries(
            replacerList.map((replacer) => [replacer.type, replacer.example]),
          ),
          schema: replacerToOpenApi(replacerList[0]!),
        })
      } else {
        acc.push({
          in: payload.in,
          name: parameterName,
          required: true,
          examples: Object.fromEntries(
            replacerList.map((replacer) => [replacer.type, replacer.example]),
          ),
          schema: { oneOf: replacerList.map(replacerToOpenApi) },
        })
      }
      return acc
    },
    [] as OpenAPIV3_1.ParameterObject[],
  )
}

export const getOpenApiPaths = (payload: {
  groupedStoredDataByUrl: GroupedStoredDataByUrl
  skippedHeaderList: string[]
}) => {
  logger.info('open api docs paths generating...')
  const result = Object.fromEntries(
    Object.entries(payload.groupedStoredDataByUrl).map(
      ([url, groupedByMethod]) => {
        logger.info('open api docs path generating...', { url })
        const perMethodEntries = getOpenApiSchemaEntriesPerMethod({
          groupedStoredDataByMethod: groupedByMethod.data,
          skippedHeaderList: payload.skippedHeaderList,
        })
        const objectPerMethod: OpenAPIV3_1.PathItemObject = Object.fromEntries(
          perMethodEntries.filter(
            ([, perMethod]) => Object.keys(perMethod).length !== 0,
          ),
        )
        return [
          url.endsWith('//') ? url.slice(0, -1) : url,
          {
            ...objectPerMethod,
            parameters: mapParameterListToOpenApiParameters({
              parameterList: groupedByMethod.parameterList,
              in: 'path',
            }),
          },
        ]
      },
    ),
  )

  logger.info('open api docs paths generated')
  return result
}

export const readDirectoryStoredDataFiles = (payload: {
  directoryPath: string
}): StoredData[] => {
  logger.info('lib open api docs stored data files directory loading...')
  const filePathList = readdirSync(payload.directoryPath, {
    recursive: true,
  }) as string[]
  const result = filePathList
    .filter((path) => path.endsWith('.json'))
    .map(
      (path) =>
        JSON.parse(
          readFileSync(`${payload.directoryPath}/${path}`).toString(),
        ) as StoredData,
    )

  logger.info('lib open api docs stored data files directory loaded')
  return result
}

const state: OpenApiGeneratorState = {
  initializedAt: DateTime.now().toISO(),
  counter: 0,
}
export const openApiGeneratorGenerate = (payload: {
  openApiInfo: OpenAPIV3_1.InfoObject
  skippedHeaderList: string[]
  storedDataList: StoredData[]
}): OpenAPIV3_1.Document => {
  logger.info('lib open api docs generating...')
  const result = {
    openapi: '3.1.0',
    info: payload.openApiInfo,
    paths: getOpenApiPaths({
      skippedHeaderList: payload.skippedHeaderList,
      groupedStoredDataByUrl: groupStoredData({
        storedDataList: payload.storedDataList,
      }),
    }),
  }
  logger.info('lib open api docs generated...')
  return result
}
export type StoreRequestDataPayload = {
  timestamp: string
  configuration: {
    endpoint: RouteName | EndpointName
    origin: string
    method: keyof Pick<
      Scope,
      Lowercase<Exclude<HTTPMethod, HTTPMethod.CONNECT | HTTPMethod.TRACE>>
    >
    path: string
    query?: { [key: string]: string }
  }
  request: {
    headers: StoredDataHeaders
    method: string
    parsedBody: { [key: string]: any }
    originalBody: string | { [key: string]: any }
    urlParts: {
      host: string
      protocol: string
      port: number
    }
  }
  response: {
    headers?: StoredDataHeaders
    statusCode: StatusCodes
    body?: { [key: string]: any }
  }
}
export const openApiGeneratorStoreData = async (
  payload: StoreRequestDataPayload,
): Promise<void> => {
  if (
    envVariables.OPEN_API_PATH === undefined ||
    envVariables.OPEN_API_PATH === ''
  ) {
    return
  }
  try {
    const storedData = await makeStoredData({ state, ...payload })
    const directory = `${envVariables.OPEN_API_PATH}/${createDirectoryPath(storedData)}`
    mkdirSync(directory, { recursive: true })
    writeFileSync(
      `${directory}/${state.initializedAt}-${state.counter}.json`,
      prettyJsonParser(storedData),
    )
    state.counter += 1
  } catch (error) {
    return abortTestsWithError({
      data: { payload, error },
      // eslint-disable-next-line no-restricted-globals
      message: `Cannot create temporary file for openapi generator: \n ${error instanceof Error ? error.stack : ''}`,
    })
  }
}
