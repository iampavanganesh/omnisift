import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  sessionId?: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  return requestContext.getStore() ?? {};
}
