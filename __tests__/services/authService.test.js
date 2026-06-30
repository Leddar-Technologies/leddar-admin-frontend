const SESSION_KEY = 'leddar_admin_session';

// localStorage is set up in jest.setup.js
beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
  global.window = global.window || {};
  delete window.location;
  window.location = { href: '' };
});

import { getSession, login, logout } from '../../services/authService';

// ─── getSession ──────────────────────────────────────────────────────────────

describe('getSession', () => {
  test('returns null when nothing stored', () => {
    expect(getSession()).toBeNull();
  });

  test('returns null for invalid JSON', () => {
    localStorage.setItem(SESSION_KEY, 'not-json');
    expect(getSession()).toBeNull();
  });

  test('returns null for literal null string', () => {
    localStorage.setItem(SESSION_KEY, 'null');
    expect(getSession()).toBeNull();
  });

  test('returns parsed session when valid', () => {
    const session = { token: 'abc', refreshToken: 'xyz', email: 'admin@test.com', role: 'ADMIN' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    expect(getSession()).toEqual(session);
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login', () => {
  test('throws on non-ok response', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });
    await expect(login({ email: 'a@a.com', password: 'bad', role: 'ADMIN' }))
      .rejects.toThrow('Invalid credentials');
  });

  test('stores session and returns user on success', async () => {
    const user = { email: 'admin@test.com', role: 'ADMIN' };
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { token: 'access-tok', refreshToken: 'refresh-tok', user },
      }),
    });
    const result = await login({ email: 'admin@test.com', password: 'pass', role: 'ADMIN' });
    expect(result).toEqual(user);
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY));
    expect(stored.token).toBe('access-tok');
    expect(stored.refreshToken).toBe('refresh-tok');
    expect(stored.email).toBe('admin@test.com');
    expect(stored.role).toBe('ADMIN');
  });

  test('returns null when response has no token', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, data: {} }),
    });
    const result = await login({ email: 'a@a.com', password: 'p', role: 'ADMIN' });
    expect(result).toBeNull();
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────

describe('logout', () => {
  test('removes session from localStorage and redirects', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 'tok' }));
    logout();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
