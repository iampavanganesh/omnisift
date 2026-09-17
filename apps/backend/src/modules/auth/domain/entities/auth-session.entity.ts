/** A signed-in session. Pure domain — no framework, no Supabase types. */
export class AuthSession {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresAt: number, // epoch seconds
  ) {}
}
