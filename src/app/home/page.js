'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaArrowRight,
  FaChartLine,
  FaClipboardList,
  FaFileInvoiceDollar,
  FaUserPlus,
  FaUsers,
  FaChevronRight,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
} from 'react-icons/fa';

import AppShell from '../../components/AppShell';
import {
  getStoredUser,
  getToken,
  isStaffRole,
  isAdminRole,
} from '../../libs/auth';


/* =========================================================
   PORTAL CARD
========================================================= */

function PortalCard({
  href,
  icon: Icon,
  title,
  description,
  accent = 'blue',
  badge,
}) {
  const accents = {
    blue: {
      icon: 'bg-blue-600 text-white',
      iconSoft: 'bg-blue-50 text-blue-600',
      badge: 'bg-blue-50 text-blue-700',
      hover: 'group-hover:border-blue-200',
    },

    green: {
      icon: 'bg-emerald-600 text-white',
      iconSoft: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700',
      hover: 'group-hover:border-emerald-200',
    },

    violet: {
      icon: 'bg-violet-600 text-white',
      iconSoft: 'bg-violet-50 text-violet-600',
      badge: 'bg-violet-50 text-violet-700',
      hover: 'group-hover:border-violet-200',
    },

    amber: {
      icon: 'bg-amber-500 text-white',
      iconSoft: 'bg-amber-50 text-amber-700',
      badge: 'bg-amber-50 text-amber-700',
      hover: 'group-hover:border-amber-200',
    },

    indigo: {
      icon: 'bg-indigo-600 text-white',
      iconSoft: 'bg-indigo-50 text-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700',
      hover: 'group-hover:border-indigo-200',
    },

    cyan: {
      icon: 'bg-cyan-600 text-white',
      iconSoft: 'bg-cyan-50 text-cyan-600',
      badge: 'bg-cyan-50 text-cyan-700',
      hover: 'group-hover:border-cyan-200',
    },
  };

  const style = accents[accent] || accents.blue;

  return (
    <Link
      href={href}
      className={`
        group relative flex min-h-[210px] flex-col
        rounded-2xl border border-slate-200 bg-white
        p-5 sm:p-6
        transition-all duration-200
        hover:-translate-y-1 hover:border-slate-300
        hover:shadow-lg
        active:scale-[0.99]
        ${style.hover}
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div
          className={`
            flex h-11 w-11 shrink-0 items-center justify-center
            rounded-xl shadow-sm
            sm:h-12 sm:w-12
            ${style.icon}
          `}
        >
          <Icon className="text-lg sm:text-xl" />
        </div>

        {badge && (
          <span
            className={`
              rounded-full px-2.5 py-1
              text-[10px] font-bold uppercase tracking-wide
              ${style.badge}
            `}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-5 flex-1">
        <h3 className="text-[17px] font-bold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h3>

        <p className="mt-2 text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
          {description}
        </p>
      </div>

      {/* Bottom action */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span
          className={`
            text-xs font-semibold
            ${style.iconSoft.split(' ')[1]}
          `}
        >
          Open service
        </span>

        <span
          className={`
            flex h-8 w-8 items-center justify-center
            rounded-full
            transition-all duration-200
            group-hover:translate-x-1
            ${style.iconSoft}
          `}
        >
          <FaArrowRight className="text-xs" />
        </span>
      </div>
    </Link>
  );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 sm:text-xs">
            {eyebrow}
          </span>
        </div>
      )}

      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {title}
      </h2>

      {description && (
        <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500 sm:text-[15px] sm:leading-6">
          {description}
        </p>
      )}
    </div>
  );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function HomePortalPage() {
  const router = useRouter();
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


  /* =======================================================
     LOADING
  ======================================================= */

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-xs font-semibold text-slate-400">
            Loading your portal...
          </p>
        </div>
      </div>
    );
  }


  const staff = isStaffRole(user.role);
  const admin = isAdminRole(user.role);


  return (
    <AppShell>

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            {/* Welcome */}
            <div className="max-w-2xl">

              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Secure portal
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Welcome back,{' '}
                <span className="text-blue-600">
                  {user.username}
                </span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-5 text-slate-500 sm:mt-3 sm:text-base sm:leading-6">
                {staff
                  ? 'Access the tools you need to manage shareholder services and daily operations.'
                  : 'Manage your shareholder information, dividend decisions, and payment history.'}
              </p>

            </div>




          </div>
        </div>
      </section>


      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">


        {/* =================================================
            SHAREHOLDER
        ================================================= */}

        {!staff && (
          <section className="mb-12 sm:mb-16">

            <SectionHeader
              eyebrow="Shareholder services"
              title="What would you like to do?"
              description="Quick access to your investment and dividend services."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <PortalCard
                href="/devidenddetail"
                icon={FaChartLine}
                title="Dividend Insights"
                description="View your capital balances, dividend information, and annual payment history."
                accent="green"
                badge="Finance"
              />

              <PortalCard
                href="/fillform"
                icon={FaFileInvoiceDollar}
                title="Investment Decision"
                description="Choose whether to reinvest your current dividend into capital or withdraw it."
                accent="blue"
                badge="Action"
              />

              <PortalCard
                href="/my-decisions"
                icon={FaClipboardList}
                title="Submission History"
                description="Review your previous decisions and check their current approval status."
                accent="violet"
                badge="Records"
              />

            </div>
          </section>
        )}


        {/* =================================================
            STAFF
        ================================================= */}

        {staff && (
          <section className="mb-12 sm:mb-16">

            <SectionHeader
              eyebrow="Staff operations"
              title="Operations Center"
              description="Tools for processing shareholder requests and maintaining records."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <PortalCard
                href="/staff-fillform"
                icon={FaFileInvoiceDollar}
                title="Assisted Filing"
                description="Submit dividend decision forms on behalf of visiting shareholders."
                accent="blue"
                badge="Front desk"
              />

              <PortalCard
                href="/formbasket"
                icon={FaUsers}
                title="Decision Basket"
                description="Review, filter, and process submitted shareholder decisions."
                accent="green"
                badge="Operations"
              />

              <PortalCard
                href="/dividendupload"
                icon={FaFileInvoiceDollar}
                title="Bulk Data Upload"
                description="Import shareholder dividend records using the approved data format."
                accent="indigo"
                badge="Database"
              />

              <PortalCard
                href="/manage-shareholders"
                icon={FaUsers}
                title="Shareholder Registry"
                description="View, update, and reconcile shareholder registration records."
                accent="cyan"
                badge="Registry"
              />

            </div>
          </section>
        )}


        {/* =================================================
            ADMIN
        ================================================= */}

        {admin && (
          <section className="mb-12 sm:mb-16">

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 lg:p-7">

              <div className="mb-5 flex items-start gap-3 sm:mb-6">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <FaShieldAlt className="text-sm" />
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-amber-950 sm:text-xl">
                    System Administration
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-amber-800 sm:text-sm">
                    Manage team access and platform permissions.
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <PortalCard
                  href="/register"
                  icon={FaUserPlus}
                  title="User Management"
                  description="Create staff accounts and manage system access roles."
                  accent="amber"
                  badge="System"
                />

              </div>

            </div>

          </section>
        )}


        {/* =================================================
            NOTICE / CTA
        ================================================= */}

        <section className="overflow-hidden rounded-2xl bg-slate-900">

          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">

            <div className="flex gap-4">

              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 sm:flex">
                <FaClock />
              </div>

              <div>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  {staff
                    ? 'Daily reconciliation reminder'
                    : 'Dividend decision deadline'}
                </h3>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  {staff
                    ? 'Please ensure physical forms are reconciled with digital entries at the end of each working day.'
                    : 'Dividend reinvestment decisions are subject to the applicable fiscal-year deadline.'}
                </p>
              </div>

            </div>


            <Link
              href={staff ? '/formbasket' : '/fillform'}
              className="
                flex w-full shrink-0 items-center justify-center
                gap-2 rounded-xl bg-blue-600
                px-5 py-3
                text-sm font-bold text-white
                transition-colors
                hover:bg-blue-500
                active:scale-[0.98]
                sm:w-auto
              "
            >
              {staff ? 'Open decisions' : 'Make a decision'}

              <FaChevronRight className="text-xs" />
            </Link>

          </div>

        </section>


        {/* Small footer status */}

        <div className="mt-7 flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-2">

          <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 sm:text-xs">
            <FaCheckCircle className="text-emerald-500" />
            Secure connection
          </span>

          <span className="hidden text-slate-300 sm:inline">
            •
          </span>

          <span className="text-[10px] text-slate-400 sm:text-xs">
            Awash Insurance Shareholder Portal
          </span>

        </div>

      </main>

    </AppShell>
  );
}