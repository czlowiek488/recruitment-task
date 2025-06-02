export type RemoveUnderscore<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head} ${RemoveUnderscore<Tail>}`
    : Lowercase<S>
