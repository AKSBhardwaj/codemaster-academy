import { InjectionToken, inject } from '@angular/core';
import { PersistenceService } from './persistence.service';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/**
 * Authentication backend contract. The v1 implementation keeps demo accounts in this browser only.
 * A real backend (sessions, tokens, multi-device sync) is another implementation of this interface.
 */
export interface AuthProvider {
  restore(): Promise<DemoUser | null>;
  register(name: string, email: string, password: string): Promise<DemoUser>;
  login(email: string, password: string): Promise<DemoUser>;
  logout(): Promise<void>;
  updateProfile(patch: Partial<Pick<DemoUser, 'name' | 'email'>>): Promise<DemoUser>;
  deleteAccount(): Promise<void>;
}

export class AuthError extends Error {}

interface StoredAccount extends DemoUser {
  salt: string;
  passwordHash: string;
}

const ACCOUNTS_KEY = 'auth:accounts';
const SESSION_KEY = 'auth:session';

function requireSecureContext(): void {
  if (!globalThis.crypto?.subtle)
    throw new AuthError(
      'Demo accounts need a secure context (https or localhost) because passwords are hashed with Web Crypto.',
    );
}

async function hash(salt: string, password: string): Promise<string> {
  requireSecureContext();
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function publicUser(account: StoredAccount): DemoUser {
  const { salt: _salt, passwordHash: _hash, ...user } = account;
  return user;
}

/**
 * Browser-local demo accounts. Passwords are salted and hashed before storage, but this is NOT a secure
 * authentication system: data never leaves the browser, anyone with access to the device can read it,
 * and nothing synchronises between devices. The UI says so wherever accounts appear.
 */
export class LocalAuthProvider implements AuthProvider {
  private readonly persistence = inject(PersistenceService);

  async restore(): Promise<DemoUser | null> {
    const id = this.persistence.read<string | null>(SESSION_KEY, null);
    if (!id) return null;
    const account = this.accounts().find((a) => a.id === id);
    return account ? publicUser(account) : null;
  }

  async register(name: string, email: string, password: string): Promise<DemoUser> {
    requireSecureContext();
    const normalised = email.trim().toLowerCase();
    if (this.accounts().some((a) => a.email === normalised))
      throw new AuthError('An account with this email already exists in this browser.');
    const salt = crypto.randomUUID();
    const account: StoredAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalised,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: await hash(salt, password),
    };
    this.persistence.write(ACCOUNTS_KEY, [...this.accounts(), account]);
    this.persistence.write(SESSION_KEY, account.id);
    return publicUser(account);
  }

  async login(email: string, password: string): Promise<DemoUser> {
    const account = this.accounts().find((a) => a.email === email.trim().toLowerCase());
    if (!account || account.passwordHash !== (await hash(account.salt, password)))
      throw new AuthError('Invalid email or password.');
    this.persistence.write(SESSION_KEY, account.id);
    return publicUser(account);
  }

  async logout(): Promise<void> {
    this.persistence.remove(SESSION_KEY);
  }

  async updateProfile(patch: Partial<Pick<DemoUser, 'name' | 'email'>>): Promise<DemoUser> {
    const id = this.persistence.read<string | null>(SESSION_KEY, null);
    const accounts = this.accounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) throw new AuthError('You are not logged in.');
    const email = patch.email?.trim().toLowerCase();
    if (email && accounts.some((a) => a.email === email && a.id !== id))
      throw new AuthError('Another account already uses this email.');
    const updated: StoredAccount = {
      ...accounts[index],
      ...(patch.name ? { name: patch.name.trim() } : {}),
      ...(email ? { email } : {}),
    };
    accounts[index] = updated;
    this.persistence.write(ACCOUNTS_KEY, accounts);
    return publicUser(updated);
  }

  async deleteAccount(): Promise<void> {
    const id = this.persistence.read<string | null>(SESSION_KEY, null);
    this.persistence.write(
      ACCOUNTS_KEY,
      this.accounts().filter((a) => a.id !== id),
    );
    this.persistence.remove(SESSION_KEY);
  }

  private accounts(): StoredAccount[] {
    return this.persistence.read<StoredAccount[]>(ACCOUNTS_KEY, []);
  }
}

export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER', {
  providedIn: 'root',
  factory: () => new LocalAuthProvider(),
});
