"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "react-icons/fa";

import AppShell from "../../components/AppShell";
import { useTranslation } from "../../components/LanguageProvider";
import {
  getStoredUser,
  getToken,
  isStaffRole,
  isAdminRole,
} from "../../libs/auth";

/* =========================================================
   PORTAL CARD
========================================================= */

function PortalCard({
  href,
  icon: Icon,
  title,
  description,
  accent = "blue",
  badge,
}) {
  const { t } = useTranslation();
  const accents = {
    blue: {
      icon: "bg-blue-600 text-white",
      iconSoft:
        "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
      iconText: "text-blue-600 dark:text-blue-300",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      hover: "group-hover:border-blue-200 dark:group-hover:border-blue-700",
    },

    green: {
      icon: "bg-emerald-600 text-white",
      iconSoft:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
      iconText: "text-emerald-600 dark:text-emerald-300",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      hover:
        "group-hover:border-emerald-200 dark:group-hover:border-emerald-700",
    },

    violet: {
      icon: "bg-violet-600 text-white",
      iconSoft:
        "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
      iconText: "text-violet-600 dark:text-violet-300",
      badge:
        "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
      hover: "group-hover:border-violet-200 dark:group-hover:border-violet-700",
    },

    amber: {
      icon: "bg-amber-500 text-white",
      iconSoft:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      iconText: "text-amber-700 dark:text-amber-300",
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      hover: "group-hover:border-amber-200 dark:group-hover:border-amber-700",
    },

    indigo: {
      icon: "bg-indigo-600 text-white",
      iconSoft:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300",
      iconText: "text-indigo-600 dark:text-indigo-300",
      badge:
        "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
      hover: "group-hover:border-indigo-200 dark:group-hover:border-indigo-700",
    },

    cyan: {
      icon: "bg-cyan-600 text-white",
      iconSoft:
        "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300",
      iconText: "text-cyan-600 dark:text-cyan-300",
      badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
      hover: "group-hover:border-cyan-200 dark:group-hover:border-cyan-700",
    },
  };

  const style = accents[accent] || accents.blue;

  return (
    <Link
      href={href}
      className={`
        group relative flex min-h-[210px] flex-col
        rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800
        p-5 sm:p-6
        transition-all duration-200
        hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-600
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
            {t(badge)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mt-5 flex-1">
        <h3 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
          {t(title)}
        </h3>

        <p className="mt-2 text-[13px] leading-5 text-slate-500 dark:text-slate-400 sm:text-sm sm:leading-6">
          {t(description)}
        </p>
      </div>

      {/* Bottom action */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
        <span
          className={`
            text-xs font-semibold
            ${style.iconText}
          `}
        >
          {t("home.openService")}
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
  const { t } = useTranslation();

  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300 sm:text-xs">
            {t(eyebrow)}
          </span>
        </div>
      )}

      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
        {t(title)}
      </h2>

      {description && (
        <p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500 dark:text-slate-400 sm:text-[15px] sm:leading-6">
          {t(description)}
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
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
  }, [router]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

          <p className="mt-4 text-xs font-semibold text-slate-400">
            {t("home.loading")}
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

      <section className="border-b border-slate-200 py-7 dark:border-slate-700 sm:py-9 lg:py-11">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            {/* Welcome */}
            <div className="max-w-2xl">
              {/* <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("home.securePortal")}
              </div> */}

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl lg:text-4xl">
                {t("home.welcomeBack")}{" "}
                <span className="text-blue-600">{user.username}</span>
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-5 text-slate-500 dark:text-slate-400 sm:mt-3 sm:text-base sm:leading-6">
                {staff
                  ? t("home.staffSubtitle")
                  : t("home.shareholderSubtitle")}
              </p>
            </div>
          </div>
      </section>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="py-8 sm:py-10 lg:py-12">
        {/* =================================================
            SHAREHOLDER
        ================================================= */}

        {!staff && (
          <section className="mb-12 sm:mb-16">
            <SectionHeader
              eyebrow="home.shareholderServices"
              title="home.shareholderTitle"
              description="home.shareholderDescription"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PortalCard
                href="/devidenddetail"
                icon={FaChartLine}
                title="home.dividendInsights"
                description="home.dividendInsightsDescription"
                accent="green"
                badge="home.finance"
              />

              <PortalCard
                href="/fillform"
                icon={FaFileInvoiceDollar}
                title="home.investmentDecision"
                description="home.investmentDecisionDescription"
                accent="blue"
                badge="home.action"
              />

              <PortalCard
                href="/my-decisions"
                icon={FaClipboardList}
                title="home.submissionHistory"
                description="home.submissionHistoryDescription"
                accent="violet"
                badge="home.records"
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
              eyebrow="home.staffOperations"
              title="home.operationsCenter"
              description="home.staffOperationsDescription"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <PortalCard
                href="/staff-fillform"
                icon={FaFileInvoiceDollar}
                title="home.assistedFiling"
                description="home.assistedFilingDescription"
                accent="blue"
                badge="home.frontDesk"
              />

              <PortalCard
                href="/formbasket"
                icon={FaUsers}
                title="home.decisionBasket"
                description="home.decisionBasketDescription"
                accent="green"
                badge="home.operations"
              />

              <PortalCard
                href="/dividendupload"
                icon={FaFileInvoiceDollar}
                title="home.bulkDataUpload"
                description="home.bulkDataUploadDescription"
                accent="indigo"
                badge="home.database"
              />

              <PortalCard
                href="/manage-shareholders"
                icon={FaUsers}
                title="home.shareholderRegistry"
                description="home.shareholderRegistryDescription"
                accent="cyan"
                badge="home.registry"
              />
            </div>
          </section>
        )}

        {/* =================================================
            ADMIN
        ================================================= */}

        {admin && (
          <section className="mb-12 sm:mb-16">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-800 dark:bg-amber-950/30 sm:p-6 lg:p-7">
              <div className="mb-5 flex items-start gap-3 sm:mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <FaShieldAlt className="text-sm" />
                </div>

                <div>
                  <h2 className="text-lg font-bold tracking-tight text-amber-950 dark:text-amber-100 sm:text-xl">
                    {t("home.systemAdministration")}
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200 sm:text-sm">
                    {t("home.systemAdministrationDescription")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PortalCard
                  href="/register"
                  icon={FaUserPlus}
                  title="home.userManagement"
                  description="home.userManagementDescription"
                  accent="amber"
                  badge="home.system"
                />
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            NOTICE / CTA
        ================================================= */}

        <section
          className="
    relative overflow-hidden rounded-2xl
    bg-gradient-to-br
    from-slate-900 via-blue-950 to-blue-900
    dark:from-slate-950 dark:via-blue-950 dark:to-slate-900
  "
        >
          <div
            className="
              pointer-events-none absolute
              -right-16 -top-20
              h-48 w-48 rounded-full
              bg-blue-500/10 blur-3xl
              dark:bg-blue-400/5
            "
          />

          <div className="relative flex flex-col gap-4 p-5 sm:gap-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">
            {/* Content */}
            <div className="flex gap-4">
              {/* <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-400 sm:flex">
                <FaClock />
              </div> */}

              <div
                className="
                  hidden h-10 w-10 shrink-0 items-center justify-center
                  rounded-xl bg-white/10 text-blue-100
                  ring-1 ring-white/10 sm:flex
                "
              >
                <FaClock />
              </div>
              <div>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  {staff
                    ? t("home.staffReminder")
                    : t("home.shareholderDeadline")}
                </h3>
                {/* <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-300 dark:text-slate-400 sm:text-sm sm:leading-6"> */}
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-blue-100/75 sm:text-sm sm:leading-6">
                  {staff
                    ? t("home.staffReminderDescription")
                    : t("home.shareholderDeadlineDescription")}
                </p>
              </div>
            </div>
            <Link
              href={staff ? "/formbasket" : "/fillform"}
              className="
                flex w-full shrink-0 items-center justify-center gap-2
                rounded-xl bg-white px-5 py-3.5
                text-sm font-bold text-blue-900
                shadow-sm transition-all duration-200
                hover:bg-blue-50 hover:shadow-md
                active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-white/60
                focus:ring-offset-2 focus:ring-offset-blue-900
                sm:w-auto
              "
            >
              {staff ? t("home.openDecisions") : t("home.makeDecision")}
              <FaChevronRight className="text-xs" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
