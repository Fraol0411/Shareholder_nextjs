'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';
import { cn } from '../../libs/utils';
import { Button } from './button';

const SIDEBAR_COOKIE = 'ops_sidebar_collapsed';
const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_ICON = '3.5rem';

const SidebarContext = React.createContext(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

export function SidebarProvider({ defaultCollapsed = false, children, className, style, ...props }) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${SIDEBAR_COOKIE}=`))
        ?.split('=')[1];
      if (stored === '1') setCollapsed(true);
      if (stored === '0') setCollapsed(false);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsedPersist = React.useCallback((value) => {
    setCollapsed(value);
    try {
      document.cookie = `${SIDEBAR_COOKIE}=${value ? '1' : '0'}; path=/; max-age=31536000`;
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = React.useCallback(() => {
    setCollapsedPersist(!collapsed);
  }, [collapsed, setCollapsedPersist]);

  const value = React.useMemo(
    () => ({
      collapsed,
      setCollapsed: setCollapsedPersist,
      toggle,
      mobileOpen,
      setMobileOpen,
      mounted,
    }),
    [collapsed, setCollapsedPersist, toggle, mobileOpen, mounted]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        style={{
          '--sidebar-width': SIDEBAR_WIDTH,
          '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
          ...style,
        }}
        className={cn('group/sidebar-wrapper flex min-h-svh w-full', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children, ...props }) {
  const { collapsed, mobileOpen, setMobileOpen, mounted } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mounted && mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        data-slot="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        data-mobile-open={mobileOpen ? 'true' : 'false'}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-svh flex-col border-r border-slate-200/80 bg-white text-slate-900 transition-[width,transform] duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
          'w-[var(--sidebar-width)]',
          collapsed && 'md:w-[var(--sidebar-width-icon)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </>
  );
}

export function SidebarInset({ className, ...props }) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        'relative flex min-h-svh min-w-0 flex-1 flex-col bg-gradient-to-b from-brand-secondary-soft/40 via-white to-brand-primary-soft/20 dark:from-slate-900 dark:via-slate-950 dark:to-brand-primary-soft/20',
        'md:ml-[var(--sidebar-width)]',
        collapsed && 'md:ml-[var(--sidebar-width-icon)]',
        'transition-[margin] duration-200 ease-out',
        className
      )}
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }) {
  return <div data-slot="sidebar-header" className={cn('flex flex-col gap-2 border-b border-slate-100 p-3 dark:border-slate-800', className)} {...props} />;
}

export function SidebarFooter({ className, ...props }) {
  return <div data-slot="sidebar-footer" className={cn('mt-auto flex flex-col gap-2 border-t border-slate-100 p-3 dark:border-slate-800', className)} {...props} />;
}

export function SidebarContent({ className, ...props }) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden p-2', className)}
      {...props}
    />
  );
}

export function SidebarGroup({ className, ...props }) {
  return <div data-slot="sidebar-group" className={cn('relative flex w-full min-w-0 flex-col p-1', className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }) {
  const { collapsed } = useSidebar();
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        'flex h-8 items-center px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400',
        collapsed && 'md:justify-center md:px-0 md:text-[0px] md:opacity-0',
        className
      )}
      {...props}
    />
  );
}

export function SidebarGroupContent({ className, ...props }) {
  return <div data-slot="sidebar-group-content" className={cn('w-full text-sm', className)} {...props} />;
}

export function SidebarMenu({ className, ...props }) {
  return <ul data-slot="sidebar-menu" className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }) {
  return <li data-slot="sidebar-menu-item" className={cn('group/menu-item relative', className)} {...props} />;
}

export function SidebarMenuButton({
  className,
  asChild = false,
  isActive = false,
  tooltip,
  ...props
}) {
  const { collapsed } = useSidebar();
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? 'true' : 'false'}
      title={collapsed ? tooltip : undefined}
      className={cn(
        'relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-sm font-medium outline-none transition-colors',
        'text-slate-600 hover:bg-brand-secondary-soft hover:text-brand-primary dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-brand-secondary',
        isActive &&
          'bg-brand-primary text-white shadow-sm shadow-brand-primary/20 hover:bg-brand-primary-hover hover:text-white dark:hover:bg-brand-primary-hover dark:hover:text-white',
        collapsed && 'md:justify-center md:px-2',
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }) {
  const { collapsed } = useSidebar();
  return (
    <span
      data-slot="sidebar-menu-badge"
      className={cn(
        'pointer-events-none absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
        collapsed && 'md:right-1 md:top-1 md:h-4 md:min-w-4',
        className
      )}
      {...props}
    />
  );
}

export function SidebarTrigger({ className, ...props }) {
  const { toggle, setMobileOpen, mobileOpen } = useSidebar();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 text-slate-600 dark:text-slate-300', className)}
      onClick={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
          setMobileOpen(!mobileOpen);
        } else {
          toggle();
        }
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export function SidebarRail({ className, ...props }) {
  const { toggle } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggle}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 right-0 z-20 hidden w-3 translate-x-1/2 cursor-ew-resize transition-colors hover:after:bg-brand-secondary/40 md:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] after:-translate-x-1/2',
        className
      )}
      {...props}
    />
  );
}
