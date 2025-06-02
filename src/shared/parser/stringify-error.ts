export const stringifyError = (error: unknown): string =>
  // eslint-disable-next-line no-restricted-globals
  error instanceof Error
    ? `${error.toString()}\n${error?.stack} \n ----- CAUSE ----- ${
        error.cause === undefined ? '' : stringifyError(error.cause)
      }`
    : JSON.stringify(error)
