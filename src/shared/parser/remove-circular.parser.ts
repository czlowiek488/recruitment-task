import type { AxiosError } from 'axios'

export const parseAxiosError = (error: AxiosError) => {
  if (!error || typeof error !== 'object')
    return { message: 'Unknown error', error }

  const parsed = {
    message: error.message || 'Axios error',
    isAxiosError: error.isAxiosError || false,
    code: error.code || null,
    config: {
      url: error.config?.url || null,
      method: error.config?.method || null,
      headers: error.config?.headers || null,
      data: error.config?.data || null,
    },
    response: error.response
      ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        }
      : null,
    stack: error.stack || null,
  }

  return parsed
}
