import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AppConfigService } from '../config/config.service';
import { requestContext, RequestContext } from './request-context';

/**
 * Populates the per-request context with:
 *  - sessionId: from the `x-session-id` header (guest-friendly, always present)
 *  - userId:    decoded LOCALLY from the Supabase JWT if a valid token is present
 *               (offline verify — no network call). Absent for guests.
 * Never blocks or throws: a bad/missing token just means no userId.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly config: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const ctx: RequestContext = {};

    const sid = req.headers['x-session-id'];
    if (typeof sid === 'string' && sid.length > 0 && sid.length <= 64) {
      ctx.sessionId = sid;
    }

    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), this.config.supabaseJwtSecret) as {
          sub?: string;
        };
        if (payload?.sub) ctx.userId = payload.sub;
      } catch {
        // Guest or expired/invalid token → no userId. Silent by design.
      }
    }

    requestContext.run(ctx, () => next());
  }
}