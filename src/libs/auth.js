'use client';

export function getStoredUser() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function logout(router) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}

export function isStaffRole(role) {
  return ['staff', 'supervisor', 'admin'].includes(role);
}

export function isAdminRole(role) {
  return role === 'admin';
}

export function getRoleLabel(role) {
  const labels = {
    staff: 'Staff',
    supervisor: 'Supervisor',
    admin: 'Administrator',
    user: 'Shareholder',
  };
  return labels[role] || 'User';
}
