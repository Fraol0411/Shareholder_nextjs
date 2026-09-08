'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  FileText,
  ClipboardList,
  ShieldCheck,
  Users,
  Lock,
  Upload,
  UserCircle,
  KeyRound,
  LogOut,
  Building2,
  ChevronDown,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './ui/sidebar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import ChangePasswordModal from './ChangePasswordModal';
import Breadcrumbs from './Breadcrumbs';
import Container from './Container';
import { useTranslation } from './LanguageProvider';
import { useApprovalsBadge } from '../hooks/useApprovalsBadge';
import {
  getStoredUser,
  logout,
  isAdminRole,
  getRoleLabel,
} from '../libs/auth';
import { cn } from '../libs/utils';

function formatBadgeCount(n) {
  if (!n || n <= 0) return null;
  if (n > 99) return '99+';
  return String(n);
}

function OpsSidebarNav({ user, pendingApprovals }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { setMobileOpen, collapsed } = useSidebar();
  const admin = isAdminRole(user?.role);

  const operations = [
    { href: '/home', label: 'nav.home', icon: Home },
    { href: '/staff-fillform', label: 'nav.fillform', icon: FileText },
    { href: '/formbasket', label: 'nav.decisions', icon: ClipboardList },
    { href: '/manage-shareholders', label: 'home.shareholderRegistry', icon: Building2 },
    { href: '/dividendupload', label: 'home.bulkDataUpload', icon: Upload },
  ];

  const administration = admin
    ? [
        {
          href: '/approvals',
          label: 'nav.approvals',
          icon: ShieldCheck,
          badge: formatBadgeCount(pendingApprovals),
          badgeTone: 'warning',
        },
        { href: '/register', label: 'nav.register', icon: Users },
        { href: '/roles', label: 'nav.roles', icon: Lock },
      ]
    : [];

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const renderItems = (items) =>
    items.map(({ href, label, icon: Icon, badge, badgeTone }) => {
      const active = isActive(href);
      return (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={active} tooltip={t(label)}>
            <Link href={href} onClick={() => setMobileOpen(false)}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn('truncate', collapsed && 'md:hidden')}>{t(label)}</span>
              {badge && (
                <SidebarMenuBadge
                  className={cn(
                    active
                      ? 'bg-white/20 text-white'
                      : badgeTone === 'warning'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                        : 'bg-brand-secondary text-white'
                  )}
                >
                  {badge}
                </SidebarMenuBadge>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <>
      <SidebarHeader>
        <Link
          href="/home"
          onClick={() => setMobileOpen(false)}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-slate-50 dark:hover:bg-slate-900',
            collapsed && 'md:justify-center'
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-white">
            <img src="/images/logo.png" alt="Awash Insurance" className="h-7 w-auto" />
          </span>
          <div className={cn('min-w-0', collapsed && 'md:hidden')}>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">Awash Insurance</p>
            <p className="truncate text-[11px] font-medium text-brand-secondary">{t('footer.portalSubtitle')}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('home.operations')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operations)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {administration.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('home.system')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(administration)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  );
}

function OpsSidebarUser({ user, onChangePassword, onLogout }) {
  const { t } = useTranslation();
  const { collapsed, setMobileOpen } = useSidebar();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <SidebarFooter>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-left transition hover:border-brand-secondary/40 hover:bg-brand-secondary-soft/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800',
            collapsed && 'md:justify-center md:px-2'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[11px] font-bold text-white">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.username}</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{getRoleLabel(user?.role)}</p>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-slate-400', collapsed && 'md:hidden')} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setMobileOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-brand-secondary-soft hover:text-brand-primary dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <UserCircle className="h-4 w-4" />
              {t('profile.title')}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onChangePassword();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-brand-secondary-soft hover:text-brand-primary dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <KeyRound className="h-4 w-4" />
              {t('nav.changePassword')}
            </button>
            <Separator />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signout')}
            </button>
          </div>
        )}
      </div>
    </SidebarFooter>
  );
}

function OpsTopBar({ pendingApprovals, isAdmin }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const badge = formatBadgeCount(pendingApprovals);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200/80 bg-white/85 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85 sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {pathname.startsWith('/approvals')
            ? t('nav.approvals')
            : pathname.startsWith('/roles')
              ? t('nav.roles')
              : pathname.startsWith('/register')
                ? t('nav.register')
                : t('home.operationsCenter')}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {isAdmin && (
          <Link
            href="/approvals?status=pending"
            className={cn(
              'relative inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-xs font-semibold transition',
              badge
                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            )}
            title={t('nav.approvals')}
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('nav.approvals')}</span>
            {badge && (
              <Badge variant="warning" className="animate-pulse">
                {badge}
              </Badge>
            )}
            {badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 sm:hidden">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
            )}
          </Link>
        )}
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default function OpsShell({ children, className = '' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
  }, []);

  const isAdmin = isAdminRole(user?.role);
  const { pending, refresh } = useApprovalsBadge({
    enabled: mounted && isAdmin,
    intervalMs: 40000,
  });

  // Refresh badge when landing on approvals pages after actions
  useEffect(() => {
    if (!mounted || !isAdmin) return undefined;
    const onFocus = () => refresh();
    window.addEventListener('ops-approvals-changed', onFocus);
    return () => window.removeEventListener('ops-approvals-changed', onFocus);
  }, [mounted, isAdmin, refresh]);

  const shellUser = useMemo(() => user, [user]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <OpsSidebarNav user={shellUser} pendingApprovals={pending} />
        <OpsSidebarUser
          user={shellUser}
          onChangePassword={() => setChangePasswordOpen(true)}
          onLogout={() => logout(router)}
        />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className={className}>
        <OpsTopBar pendingApprovals={pending} isAdmin={isAdmin} />
        <main className="w-full min-w-0 flex-1">
          <Container className="py-2 sm:py-3">
            <Breadcrumbs />
            {children}
          </Container>
        </main>
      </SidebarInset>

      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </SidebarProvider>
  );
}
