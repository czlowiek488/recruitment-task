import { HTTPMethod } from 'http-method-enum'
import type { StatusCodes } from 'http-status-codes'
import type {
  EndpointData,
  EndpointRequest,
  EndpointResponse,
} from '../shared/structure/endpoint.structure'
import {
  createEndpoint,
  EndpointName,
} from '../shared/structure/endpoint.structure'

type GoogleEndpointData = EndpointData<
  EndpointRequest<undefined, undefined, undefined, undefined>,
  EndpointResponse<StatusCodes.OK, string, undefined>
>

export const googleEndpoint = createEndpoint((dependencies) => ({
  endpointName: EndpointName.GOOGLE,
  method: HTTPMethod.GET,
  origin: dependencies.config.INTEGRATION_GOOGLE_BASE_PATH,
  path: '/',
}))<GoogleEndpointData>()

type Test2EndpointData = EndpointData<
  EndpointRequest<
    { testRequestHeaderKey: string },
    { testRequestDataKey: string },
    { testRequestQueryKey: string },
    { testRequestParamsKey: string }
  >,
  EndpointResponse<
    StatusCodes.OK,
    { testResponseDataKey: string },
    { testResponseHeaderKey: string }
  >
>

export const test2Endpoint = createEndpoint((dependencies) => ({
  endpointName: EndpointName.TEST_2,
  method: HTTPMethod.GET,
  origin: dependencies.config.INTEGRATION_EXAMPLE_URL,
  path: '/',
}))<Test2EndpointData>()
