export class UserProfile {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly phone: string | null,
    public readonly profileCompleted: boolean,
  ) {}
}
