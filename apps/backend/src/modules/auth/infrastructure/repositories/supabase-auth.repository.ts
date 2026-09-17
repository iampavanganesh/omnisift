import { Injectable } from '@nestjs/common';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../core/supabase/supabase.service';
import { PrismaService } from '../../../../core/database/prisma.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthSession } from '../../domain/entities/auth-session.entity';
import { AuthenticationError, ValidationError } from '../../../../core/errors/app-error';

/** Supabase-backed auth. Also mirrors a profile row into `users` on register. */
@Injectable()
export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async register(input: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<AuthSession> {
    const { data, error } = await this.supabase.admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (error || !data.user) {
      throw new ValidationError(error?.message ?? 'Registration failed.');
    }
    await this.prisma.user.upsert({
      where: { id: data.user.id },
      update: { fullName: input.fullName, email: input.email },
      create: { id: data.user.id, email: input.email, fullName: input.fullName },
    });
    return this.login({ email: input.email, password: input.password });
  }

  async login(input: { email: string; password: string }): Promise<AuthSession> {
    const { data, error } = await this.supabase.admin.auth.signInWithPassword(input);
    if (error || !data.session) {
      throw new AuthenticationError('Incorrect email or password.');
    }
    return this.toSession(data.session, data.user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const { data, error } = await this.supabase.admin.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw new AuthenticationError('Session expired. Please sign in again.');
    }
    return this.toSession(data.session, data.user);
  }

  async logout(accessToken: string): Promise<void> {
    // Best-effort revoke; the client also clears local tokens.
    await this.supabase.admin.auth.admin.signOut(accessToken).catch(() => undefined);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.supabase.admin.auth.resetPasswordForEmail(email);
  }

  async googleSignIn(idToken: string, accessToken?: string): Promise<AuthSession> {
    const { data, error } = await this.supabase.admin.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      access_token: accessToken,
    });
    if (error || !data.session) {
      throw new AuthenticationError('Google sign-in failed. Please try again.');
    }
    const user = data.user;
    const fullName =
      (user?.user_metadata?.full_name as string | undefined) ??
      (user?.user_metadata?.name as string | undefined) ??
      user?.email ??
      'Omnisift User';
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email ?? '', fullName },
      create: { id: user.id, email: user.email ?? '', fullName },
    });
    return this.toSession(data.session, user);
  }

  private toSession(session: Session, user: User | null): AuthSession {
    return new AuthSession(
      user?.id ?? session.user.id,
      user?.email ?? session.user.email ?? '',
      session.access_token,
      session.refresh_token,
      session.expires_at ?? 0,
    );
  }
}
