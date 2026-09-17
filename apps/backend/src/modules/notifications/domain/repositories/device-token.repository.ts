// C:\omnisift_final\apps\backend\src\modules\notifications\domain\repositories\device-token.repository.ts
export abstract class DeviceTokenRepository {
  /** Register or refresh a device's FCM token for this user. */
  abstract upsert(userId: string, token: string, platform: string | null): Promise<void>;
  /** Remove a token (on logout). Scoped to the owner. */
  abstract remove(userId: string, token: string): Promise<void>;
  /** All active FCM tokens for a user (used by the push sender in 4c). */
  abstract tokensForUser(userId: string): Promise<string[]>;
  /** Delete a token that FCM reported as invalid/expired (any user). */
  abstract deleteToken(token: string): Promise<void>;
}
