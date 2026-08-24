'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaUserCircle,
  FaUser,
  FaIdCard,
  FaPhone,
  FaHashtag,
  FaBuilding,
  FaShieldAlt,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { useTranslation } from '../../components/LanguageProvider';
import { getStoredUser, getToken, getRoleLabel } from '../../libs/auth';

const profileFields = [
  { key: 'name', label: 'profile.name', icon: FaUser },
  { key: 'username', label: 'profile.username', icon: FaUserCircle },
  { key: 'role', label: 'profile.role', icon: FaShieldAlt },
  { key: 'phone', label: 'profile.phone', icon: FaPhone },
  { key: 'reg_no', label: 'profile.registrationNo', icon: FaHashtag },
  { key: 'sif_no', label: 'profile.sifNo', icon: FaBuilding },
  { key: 'national_id', label: 'profile.nationalId', icon: FaIdCard },
];

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) {
      router.replace('/login');
      return;
    }
    setUser(storedUser);
  }, [router]);

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-400" />
        </div>
      </AppShell>
    );
  }

  const displayName = user.name || user.username || t('profile.defaultName');
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell>
      <div className="py-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            <FaUserCircle className="text-sky-600" />
            {t('profile.title')}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            {t('profile.subtitle')}
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4 bg-gradient-to-r from-sky-50 to-blue-50 p-5 dark:from-slate-700 dark:to-slate-700 sm:p-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-bold text-white shadow-sm">
              {initials || 'U'}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">{displayName}</h2>
              <p className="mt-1 text-sm font-medium text-sky-700 dark:text-sky-300">{getRoleLabel(user.role)}</p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            {profileFields.map(({ key, label, icon: Icon }) => {
              const value = key === 'role' ? getRoleLabel(user.role) : user[key];
              return (
                <div key={key} className="flex min-w-0 items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-slate-700 dark:text-sky-300">
                    <Icon className="text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{t(label)}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{value || t('profile.notProvided')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
