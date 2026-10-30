// src/libs/auth.js

const isBrowser = () => typeof window !== 'undefined';

export function getToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem('token');
}

export function getStoredUser() {
  if (!isBrowser()) return null;

  // 1) Prefer the full JSON profile saved by the login page
  const raw =
    localStorage.getItem('user_profile') ||
    localStorage.getItem('user') ||
    localStorage.getItem('currentUser');

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (err) {
      console.warn('Stored user JSON corrupted, falling back to individual keys.');
    }
  }

  // 2) Fallback: rebuild the object from individual keys
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  if (!username && !role) return null;

  return {
    id: localStorage.getItem('id') || localStorage.getItem('user_id'),
    username,
    role,
    name: localStorage.getItem('name'),
    reg_no: localStorage.getItem('reg_no'),
    sif_no: localStorage.getItem('sif_no'),
    phone: localStorage.getItem('phone'),
    national_id: localStorage.getItem('national_id'),
  };
}

export function isStaffRole(role) {
  return role === 'staff' || role === 'admin'; // admins see staff tools too
}

/**
 * Turn a failed API response into what a page needs in order to explain it.
 *
 * A 403 that carries a reason code (DATA_VIEWING_CLOSED, ACCOUNT_DISABLED,
 * ACCOUNT_LOCKED) is a deliberate decision by the bank rather than a fault, so the
 * pages word it as an amber notice using the admin's own message. Everything else is
 * a genuine failure and stays red.
 */
export async function readApiError(res, fallback = 'Please try again.') {
  const payload = await res.json().catch(() => ({}));
  return {
    tone: res.status === 403 && payload.code ? 'notice' : 'error',
    message: payload.message || fallback,
    // The reason code and, for a deliberate closure, the full structured notice,
    // so a page can render the rich shareholder card instead of a one-liner.
    code: payload.code || null,
    notice: payload.notice || null,
  };
}

export function isAdminRole(role) {
  return role === 'admin';
}

export function getRoleLabel(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin': return 'Administrator';
    case 'staff': return 'Staff';
    case 'user':
    case 'user2': return 'Shareholder';
    default: return 'User';
  }
}

export function clearAuth() {
  if (!isBrowser()) return;
  ['token', 'user_profile', 'user', 'currentUser', 'id', 'user_id', 'username',
   'role', 'name', 'reg_no', 'sif_no', 'phone', 'national_id']
    .forEach((k) => localStorage.removeItem(k));
}

export function logout(router) {
  clearAuth();
  if (router) {
    router.replace('/login');
  } else if (isBrowser()) {
    window.location.href = '/login';
  }
}