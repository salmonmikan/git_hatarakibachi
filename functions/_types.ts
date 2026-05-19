export type FunctionContext<Env = Record<string, unknown>> = {
  request: Request
  env: Env
}

export type MiddlewareContext<Env = Record<string, unknown>> = FunctionContext<Env> & {
  next: () => Promise<Response>
}
