import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { getRequestContext } from '../context/request-context';

/**
 * Analytics event logger. Append-only writes to `analytics_events`.
 *
 * DESIGN: fire-and-forget. `track()` never throws and never blocks the caller —
 * if logging fails, the user's request (search/compare/etc.) must still succeed.
 * A failed analytics write is logged as a warning and swallowed.
 *
 * sessionId + userId are pulled from the per-request context (SessionMiddleware),
 * so callers don't have to thread them through every layer. An explicit userId
 * argument still wins when provided (e.g. guarded routes that already have it).
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log one analytics event. Fire-and-forget — do NOT await this in hot paths.
   * @param eventName  e.g. 'search', 'compare'
   * @param properties JSON payload, e.g. { productId, brand } or { query }
   * @param userId     optional explicit user id; falls back to request context
   */
  track(eventName: string, properties?: Record<string, unknown>, userId?: string | null): void {
    const ctx = getRequestContext();
    const resolvedUserId = userId ?? ctx.userId ?? null;
    const sessionId = ctx.sessionId ?? null;

    // Deliberately not awaited: analytics must never slow or break a request.
    void this.prisma.analyticsEvent
      .create({
        data: {
          eventName,
          properties: (properties ?? {}) as Prisma.InputJsonValue,
          userId: resolvedUserId,
          sessionId,
        },
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `analytics track failed (${eventName}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
  }
}
