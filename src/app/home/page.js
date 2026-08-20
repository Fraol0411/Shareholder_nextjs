'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaArrowRight,
  FaChartLine,
  FaClipboardCheck,
  FaFileInvoiceDollar,
  FaHandshake,
  FaShieldAlt,
  FaUserPlus,
  FaUsers,
} from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { getStoredUser, getToken, isStaffRole, isAdminRole, getRoleLabel } from '../../libs/auth';

function PortalCard({ href, icon: Icon, title, description, accent = 'blue', badge }) {
  const accents = {
    blue: 'from-blue-600 to-blue-800 group-hover:shadow-blue-200/60',
    green: 'from-emerald-600 to-teal-700 group-hover:shadow-emerald-200/60',
    violet: 'from-violet-600 to-purple-700 group-hover:shadow-violet-200/60',
    amber: 'from-amber-500 to-orange-600 group-hover:shadow-amber-200/60',
  
    red: 'from-red-600 to-rose-700 group-hover:shadow-red-200/60',
    pink: 'from-pink-600 to-rose-700 group-hover:shadow-pink-200/60',
    indigo: 'from-indigo-600 to-blue-700 group-hover:shadow-indigo-200/60',
    cyan: 'from-cyan-500 to-blue-600 group-hover:shadow-cyan-200/60',
    teal: 'from-teal-500 to-cyan-700 group-hover:shadow-teal-200/60',
    sky: 'from-sky-500 to-blue-700 group-hover:shadow-sky-200/60',
    lime: 'from-lime-500 to-green-600 group-hover:shadow-lime-200/60',
    orange: 'from-orange-500 to-red-600 group-hover:shadow-orange-200/60',
    fuchsia: 'from-fuchsia-600 to-pink-700 group-hover:shadow-fuchsia-200/60',
    rose: 'from-rose-500 to-pink-700 group-hover:shadow-rose-200/60',
    slate: 'from-slate-600 to-slate-800 group-hover:shadow-slate-300/60',
    gray: 'from-gray-600 to-gray-800 group-hover:shadow-gray-300/60',
    zinc: 'from-zinc-600 to-zinc-800 group-hover:shadow-zinc-300/60',
  };

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div
        className={`mb-5 inline-flex rounded-xl bg-gradient-to-br ${accents[accent]} p-3 text-white shadow-lg transition group-hover:scale-105`}
      >
        <Icon className="text-xl" />
      </div>
      {badge && (
        <span className="absolute right-5 top-5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition group-hover:gap-3">
        Open
        <FaArrowRight className="text-xs" />
      </span>
    </Link>
  );
}

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

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const staff = isStaffRole(user.role);
  const admin = isAdminRole(user.role);

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <FaShieldAlt className="text-cyan-300" />
              Secure Shareholder Services
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Welcome back, {user.username}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
              Your gateway to dividend information, decision forms, and shareholder records —
              designed as a clear, friendly portal rather than a rigid back-office dashboard.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                Role: {getRoleLabel(user.role)}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100">
                Session active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: FaHandshake, title: 'Shareholder first', text: 'Simple access to dividend details and decisions.' },
            { icon: FaClipboardCheck, title: 'Guided workflows', text: 'Step-by-step forms for staff and shareholders.' },
            { icon: FaShieldAlt, title: 'Secure & role-based', text: 'Only see the tools your account is allowed to use.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Shareholder / User section — visible to everyone */}
        <section className="mb-14">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                Shareholder Portal
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Your dividend services</h2>
              <p className="mt--2 max-w-2xl text-slate-600">
                Check balances, review payment details, and submit your dividend decision — the
                same experience a shareholder would use on the public-facing site.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <PortalCard
              href="/dashboard"
              icon={FaChartLine}
              title="Check Your Dividend"
              description="View your dividend balance, capital summary, and payment breakdown in one place."
              accent="green"
              badge="Shareholder"
            />
            <PortalCard
              href="/dashboard"
              icon={FaFileInvoiceDollar}
              title="Fill Decision Form"
              description="Choose to reinvest or withdraw your dividend and complete your submission online."
              accent="blue"
              badge="Decision"
            />
            <PortalCard
              href="/dashboard"
              icon={FaClipboardCheck}
              title="Track Your Submission"
              description="Review the decision you submitted and confirm your selected payment method."
              accent="violet"
              badge="Status"
            />
          </div>
        </section>

        {/* Staff section */}
        {staff && (
          <section className="mb-14">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Staff Workspace
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Process shareholder decisions</h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Tools for front-desk and operations staff to enter forms on behalf of shareholders
                and review all submitted decisions.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <PortalCard
                href="/fillform"
                icon={FaFileInvoiceDollar}
                title="Fill Decision Form"
                description="Enter a shareholder's dividend decision with file number, fiscal year, and payment details."
                accent="blue"
                badge="Staff"
              />
              <PortalCard
                href="/formbasket"
                icon={FaUsers}
                title="Check Shareholder Decisions"
                description="Browse, filter, and open every submitted dividend decision by fiscal year."
                accent="green"
                badge="Records"
              />
              <PortalCard
                href="/formbasket"
                icon={FaClipboardCheck}
                title="Form Basket"
                description="Search submissions by name, file number, decision type, or payment method."
                accent="violet"
                badge="Search"
              />
              <PortalCard
                href="/dividendupload"
                icon={FaClipboardCheck}
                title="Upload Shareholder Dividend"
                description="upload shareholder current year dividend details."
                accent="indigo"
                badge="Search"
              />
              <PortalCard
                href="/manage-shareholders"
                icon={FaClipboardCheck}
                title="Modify Shareholder Data"
                description="Edit or Delete shareholder details."
                accent="cyan"
                badge="Search"
              />
              
            </div>
          </section>
        )}

        {/* Admin section */}
        {admin && (
          <section>
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-600">
                Administration
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Team management</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <PortalCard
                href="/register"
                icon={FaUserPlus}
                title="Register Staff User"
                description="Create new staff accounts with appropriate roles for portal access."
                accent="amber"
                badge="Admin"
              />
            </div>
          </section>
        )}

        {/* CTA banner */}
        <section className="mt-16 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-700 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">Need to submit a decision today?</h3>
              <p className="mt-2 max-w-xl text-blue-100">
                {staff
                  ? 'Jump straight into the staff form to register a shareholder decision, or open the basket to review recent entries.'
                  : 'Open your dividend dashboard to review balances and complete your decision form.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {staff ? (
                <>
                  <Link
                    href="/fillform"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-800 shadow transition hover:bg-blue-50"
                  >
                    Fill Form
                    <FaArrowRight className="text-xs" />
                  </Link>
                  <Link
                    href="/formbasket"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    View Decisions
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-800 shadow transition hover:bg-blue-50"
                >
                  Go to My Dividend
                  <FaArrowRight className="text-xs" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
