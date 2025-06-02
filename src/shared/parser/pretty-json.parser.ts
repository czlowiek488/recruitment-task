export const prettyJsonParser = (payload: { [key: string]: any }) =>
  JSON.stringify(payload, null, 2)
