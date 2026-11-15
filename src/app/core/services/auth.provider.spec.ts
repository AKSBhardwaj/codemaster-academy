import { TestBed } from '@angular/core/testing';
import { AUTH_PROVIDER, AuthError, type AuthProvider } from './auth.provider';

describe('LocalAuthProvider', () => {
  let provider: AuthProvider;

  beforeEach(async () => {
    if (!globalThis.crypto?.subtle) {
      // jsdom has no SubtleCrypto; Node's implementation is identical for our purposes.
      const { webcrypto } = await import('node:crypto');
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
    }
    localStorage.clear();
    TestBed.configureTestingModule({});
    provider = TestBed.inject(AUTH_PROVIDER);
  });

  it('registers an account, restores the session and never stores the plain password', async () => {
    const user = await provider.register('Ada Lovelace', 'Ada@Example.com ', 'correct-horse-9');
    expect(user.email).toBe('ada@example.com');
    expect(user.name).toBe('Ada Lovelace');
    expect(await provider.restore()).toEqual(user);
    const stored = Object.entries(localStorage)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    expect(stored).toContain('cma:v1:auth:accounts');
    expect(stored).not.toContain('correct-horse-9');
  });

  it('logs in only with the right password and logs out', async () => {
    await provider.register('Ada', 'ada@example.com', 'correct-horse-9');
    await provider.logout();
    expect(await provider.restore()).toBeNull();
    await expect(provider.login('ada@example.com', 'wrong')).rejects.toBeInstanceOf(AuthError);
    await expect(provider.login('nobody@example.com', 'correct-horse-9')).rejects.toBeInstanceOf(
      AuthError,
    );
    const user = await provider.login('ADA@example.com', 'correct-horse-9');
    expect(user.name).toBe('Ada');
    expect(await provider.restore()).toEqual(user);
  });

  it('rejects duplicate emails, updates the profile and deletes the account', async () => {
    await provider.register('Ada', 'ada@example.com', 'correct-horse-9');
    await expect(provider.register('Someone', 'ada@example.com', 'another-pass-1')).rejects.toThrow(
      /already exists/,
    );
    const updated = await provider.updateProfile({ name: 'Ada L.' });
    expect(updated.name).toBe('Ada L.');
    expect((await provider.restore())?.name).toBe('Ada L.');
    await provider.deleteAccount();
    expect(await provider.restore()).toBeNull();
    await expect(provider.login('ada@example.com', 'correct-horse-9')).rejects.toBeInstanceOf(
      AuthError,
    );
  });
});
