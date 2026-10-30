'use client';

import {
  FaLandmark,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaLock,
} from 'react-icons/fa';
import { cn } from '../libs/utils';
import { DEFAULT_NOTICE } from '../libs/shareholderNotice';

/**
 * The formal notice a shareholder sees in place of their dividend data while the
 * data-viewing switch is closed. It reproduces the layout of the printed AGM
 * letter (masthead, meeting details, numbered agenda, an amber "information
 * access" panel and a sign-off) using the portal's own card styling and dark mode.
 *
 * Every piece of text comes from the stored notice, so the wording is entirely
 * admin-controlled. A missing field simply renders nothing rather than a blank row.
 */

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <Icon className="text-xs" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export function ShareholderNoticeCard({ notice, legacyText, className }) {
  // A pre-structure plain message still deserves a tidy box, not a raw sentence.
  if (!notice && legacyText) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200',
          className
        )}
        role="status"
      >
        <p className="text-sm font-semibold">Not available right now</p>
        <p className="mt-1 text-sm leading-relaxed">{legacyText}</p>
      </div>
    );
  }

  const n = { ...DEFAULT_NOTICE, ...(notice || {}) };
  const agenda = Array.isArray(n.agenda) ? n.agenda.filter(Boolean) : [];
  const hasMeeting = n.meetingDate || n.meetingTime || n.venue;

  return (
    <div
      role="status"
      className={cn(
        'mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800',
        className
      )}
    >
      {/* Masthead */}
      <div className="px-6 pt-8 pb-6 text-center sm:px-10">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <FaLandmark className="text-lg" />
        </div>
        {n.orgName && (
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800 dark:text-slate-100">{n.orgName}</p>
        )}
        {n.meetingTitle && (
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{n.meetingTitle}</h2>
        )}
        {n.badge && (
          <span className="mt-3 inline-block rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            {n.badge}
          </span>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700" />

      {/* Letter body */}
      <div className="space-y-5 px-6 py-6 text-slate-700 dark:text-slate-200 sm:px-10">
        {n.greeting && <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{n.greeting}</p>}
        {n.intro && <p className="text-sm leading-relaxed">{n.intro}</p>}

        {hasMeeting && (
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <DetailRow icon={FaCalendarAlt} label="Meeting Date" value={n.meetingDate} />
            <DetailRow icon={FaClock} label="Meeting Time" value={n.meetingTime} />
            <DetailRow icon={FaMapMarkerAlt} label="Venue" value={n.venue} />
          </div>
        )}

        {agenda.length > 0 && (
          <div>
            {n.agendaHeading && (
              <p className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-100">{n.agendaHeading}</p>
            )}
            <ol className="space-y-1.5">
              {agenda.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed">
                  <span className="font-semibold text-slate-400 dark:text-slate-500">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {n.attendanceNote && <p className="text-sm leading-relaxed">{n.attendanceNote}</p>}
      </div>

      {/* Information-access panel */}
      <div className="px-6 pb-6 sm:px-10">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-center dark:border-amber-800/70 dark:bg-amber-950/40">
          <p className="flex items-center justify-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
            <FaLock className="text-xs" />
            {n.accessHeading}
          </p>
          {n.accessMessage && (
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-800 dark:text-amber-300">{n.accessMessage}</p>
          )}
          {n.accessEnabledOn && (
            <p className="mt-3 text-2xl font-extrabold tracking-wide text-amber-900 dark:text-amber-100">{n.accessEnabledOn}</p>
          )}
          {n.accessFootnote && (
            <p className="mx-auto mt-2 max-w-md text-xs text-amber-700 dark:text-amber-400">{n.accessFootnote}</p>
          )}
        </div>
      </div>

      {/* Sign-off */}
      <div className="border-t border-slate-100 px-6 py-5 text-center dark:border-slate-700 sm:px-10">
        {n.closing && <p className="text-xs text-slate-500 dark:text-slate-400">{n.closing}</p>}
        {n.signoff && <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{n.signoff}</p>}
      </div>
    </div>
  );
}

export default ShareholderNoticeCard;
