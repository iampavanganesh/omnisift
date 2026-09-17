import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema';

/** Typed, validated access to configuration. Never read process.env elsewhere. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): Env['NODE_ENV'] {
    return this.get('NODE_ENV');
  }
  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }
  get port(): number {
    return this.get('PORT');
  }
  get logLevel(): string {
    return this.get('LOG_LEVEL');
  }
  get corsOrigins(): string[] {
    const raw = this.get('CORS_ORIGINS');
    return raw === '*' ? ['*'] : raw.split(',').map((s) => s.trim());
  }
  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }
  get supabaseUrl(): string {
    return this.get('SUPABASE_URL');
  }
  get supabaseServiceRoleKey(): string {
    return this.get('SUPABASE_SERVICE_ROLE_KEY');
  }
  get supabaseJwtSecret(): string {
    return this.get('SUPABASE_JWT_SECRET');
  }
  get serpApiKey(): string {
    return this.get('SERPAPI_KEY');
  }
  get firebaseServiceAccountPath(): string {
    return this.get('FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  get rateLimitTtl(): number {
    return this.get('RATE_LIMIT_TTL');
  }
  get rateLimitMax(): number {
    return this.get('RATE_LIMIT_MAX');
  }
}
