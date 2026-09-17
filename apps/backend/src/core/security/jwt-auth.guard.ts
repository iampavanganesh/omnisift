import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticationError } from '../errors/app-error';

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Verifies the caller's Supabase access token by asking Supabase to validate it
 * (auth.getUser). Algorithm-agnostic — works with Supabase's ES256 signing keys.
 * Applied per route: @UseGuards(JwtAuthGuard).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required.');
    }
    const { data, error } = await this.supabase.admin.auth.getUser(header.slice(7));
    if (error || !data.user) {
      throw new AuthenticationError('Invalid or expired session.');
    }
    req.user = { id: data.user.id, email: data.user.email ?? undefined };
    return true;
  }
}
