import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { requestContext, RequestContext } from './request-context';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const ctx: RequestContext = {};

    const sid = req.headers['x-session-id'];
    if (typeof sid === 'string' && sid.length > 0 && sid.length <= 64) {
      ctx.sessionId = sid;
    }

    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.decode(auth.slice(7)) as { sub?: string } | null;
        if (payload?.sub) ctx.userId = payload.sub;
      } catch {
        // Malformed/expired token — request context is best-effort, never fatal here.
      }
    }

    requestContext.run(ctx, () => next());
  }
}
