import { describe, expect, it, vi } from 'vitest';
import { LoginUseCase } from '../../src/modules/auth/application/usecases/login.usecase';
import { AuthSession } from '../../src/modules/auth/domain/entities/auth-session.entity';
import { AuthRepository } from '../../src/modules/auth/domain/repositories/auth.repository';

// Fakes over mocks: we test inputs/outputs, not internals (Handbook Vol III).
class FakeAuthRepository extends AuthRepository {
  login = vi.fn(
    async ({ email }: { email: string; password: string }) =>
      new AuthSession('u1', email, 'access', 'refresh', 123),
  );
  register = vi.fn();
  googleSignIn = vi.fn();
  refresh = vi.fn();
  logout = vi.fn();
  forgotPassword = vi.fn();
}

describe('LoginUseCase', () => {
  it('delegates to the repository and returns a session', async () => {
    const repo = new FakeAuthRepository();
    const useCase = new LoginUseCase(repo);
    const session = await useCase.execute({ email: 'a@b.com', password: 'x' });
    expect(repo.login).toHaveBeenCalledOnce();
    expect(session.userId).toBe('u1');
    expect(session.accessToken).toBe('access');
  });
});
