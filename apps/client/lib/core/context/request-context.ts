import { AsyncLocalStorage } from 'node:async_hooks';

/** What we carry for the duration of a single HTTP request. */
export interface RequestContext {
  sessionId?: string;
  userId?: string;
}

/** Per-request store. Set by SessionMiddleware; read anywhere (e.g. analytics). */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Convenience reader — returns {} when called outside a request. */
export function getRequestContext(): RequestContext {
  return requestContext.getStore() ?? {};
}