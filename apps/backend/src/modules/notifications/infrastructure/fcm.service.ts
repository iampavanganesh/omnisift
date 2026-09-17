// C:\omnisift_final\apps\backend\src\modules\notifications\infrastructure\fcm.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { DeviceTokenRepository } from '../domain/repositories/device-token.repository';
import { AppConfigService } from '../../../core/config/config.service';

/**
 * Sends FCM push notifications. Initializes the Firebase Admin SDK once from the
 * service-account JSON. If the key is missing, the service stays disabled and
 * logs a warning instead of crashing — so the app still runs without pushes.
 */
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;

  constructor(
    private readonly deviceTokens: DeviceTokenRepository,
    private readonly config: AppConfigService,
  ) {}

  onModuleInit(): void {
    try {
      const rel = this.config.firebaseServiceAccountPath;
      const abs = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
      if (!fs.existsSync(abs)) {
        this.logger.warn(`FCM disabled — service account not found at ${abs}`);
        return;
      }
      const serviceAccount = JSON.parse(fs.readFileSync(abs, 'utf8'));
      this.app = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(serviceAccount) });
      this.logger.log('🔥 FCM initialized');
    } catch (e) {
      this.logger.error(`FCM init failed: ${String(e)}`);
      this.app = null;
    }
  }

  get enabled(): boolean {
    return this.app !== null;
  }

  /**
   * Push to every device the user has registered. Cleans up tokens that FCM
   * reports as invalid/unregistered. No-op (logged) if FCM isn't initialized.
   */
  async pushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.app) {
      this.logger.warn(`FCM push skipped (disabled) | ${title}`);
      return;
    }
    const tokens = await this.deviceTokens.tokensForUser(userId);
    if (tokens.length === 0) {
      this.logger.log(`No device tokens for user ${userId} — nothing to push`);
      return;
    }

    const res = await getMessaging(this.app).sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
      android: { priority: 'high' },
    });

    // Remove dead tokens so we don't keep pushing to uninstalled apps.
    const toDelete: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code ?? '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          toDelete.push(tokens[i]);
        }
      }
    });
    for (const t of toDelete) await this.deviceTokens.deleteToken(t);

    this.logger.log(
      `📲 FCM push | user=${userId} sent=${res.successCount}/${tokens.length} cleaned=${toDelete.length}`,
    );
  }
}
