'use client';

import Link from 'next/link';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Awash Insurance" className="h-11 w-auto" />
              <div>
                <p className="text-lg font-bold text-slate-900">Awash Insurance</p>
                <p className="text-sm text-slate-500">Shareholder Dividend Portal</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Manage dividend decisions, track shareholder submissions, and access your dividend
              information — all in one secure portal built for Awash Insurance stakeholders.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/home" className="text-slate-600 transition hover:text-blue-700">
                  Portal Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 transition hover:text-blue-700">
                  Check Your Dividend
                </Link>
              </li>
              <li>
                <Link href="/fillform" className="text-slate-600 transition hover:text-blue-700">
                  Fill Decision Form
                </Link>
              </li>
              <li>
                <Link href="/formbasket" className="text-slate-600 transition hover:text-blue-700">
                  Shareholder Decisions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-blue-600" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaPhone className="shrink-0 text-blue-600" />
                <span>+251 11 000 0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaEnvelope className="shrink-0 text-blue-600" />
                <span>shareholder@awashinsurance.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {year} Awash Insurance S.C. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <span className="cursor-default hover:text-slate-700">Privacy Policy</span>
            <span className="cursor-default hover:text-slate-700">Terms of Use</span>
            <span className="cursor-default hover:text-slate-700">Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
