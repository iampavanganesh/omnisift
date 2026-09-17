import { AuthSession } from '../entities/auth-session.entity';

/** The auth port. Infrastructure supplies the Supabase-backed implementation. */
export abstract class AuthRepository {
  abstract register(input: {
    fullName: string;
    email: string;
    password: string;
  }): Promise<AuthSession>;
  abstract login(input: { email: string; password: string }): Promise<AuthSession>;
  abstract googleSignIn(idToken: string, accessToken?: string): Promise<AuthSession>;
  abstract refresh(refreshToken: string): Promise<AuthSession>;
  abstract logout(accessToken: string): Promise<void>;
  abstract forgotPassword(email: string): Promise<void>;
}
