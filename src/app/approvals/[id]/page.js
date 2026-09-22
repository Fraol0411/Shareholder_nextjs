'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineHashtag,
  HiOutlineCalendarDays,
  HiOutlineBuildingLibrary,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import AppShell from '../../../components/AppShell';
import { getStoredUser, getToken, isAdminRole } from '../../../libs/auth';
import { useTranslation } from '../../../components/LanguageProvider';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DECISION_LABELS = {
  reinvest: 'decisions.reinvest',
  fiscalreinvest: 'decisions.fiscalReinvest',
  withdraw: 'decisions.withdraw',
};

const STATUS_STYLES = {
  pending: {
    icon: HiOutlineClock,
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    label: 'approvals.pending',
  },
  approved: {
    icon: HiOutlineCheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    label: 'approvals.approved',
  },
  rejected: {
    icon: HiOutlineXCircle,
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    label: 'approvals.rejected',
  },
};

export default function ApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState(false);
  const [decision, setDecision] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [note, setNote] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!isAdminRole(user?.role)) {
      router.replace(user ? '/home' : '/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    }),
    []
  );

  const loadDecision = useCallback(async () => {
    const id = params?.id;
    if (!id) return;

    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approvals/${id}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.status === 404) {
        setNotFound(true);
        setDecision(null);
        return;
      }
      if (!res.ok) throw new Error(data.message || t('approvals.loadFailed'));
      setDecision(data.decision);
      setNote(data.decision?.internal_note || '');
    } catch (err) {
      toast.error(err.message);
      setDecision(null);
    } finally {
      setIsLoading(false);
    }
  }, [params?.id, authHeaders, t]);

  useEffect(() => {
    if (authorized) loadDecision();
  }, [authorized, loadDecision]);

  const handleApprove = async () => {
    if (!decision || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approvals/${decision.id}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'approve',
          internal_note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('approvals.approveFailed'));
      setDecision(data.decision);
      toast.success(t('approvals.approveSuccess'));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ops-approvals-changed'));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!decision || isSubmitting) return;
    if (!rejectReason.trim()) {
      toast.error(t('approvals.rejectReasonRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/approvals/${decision.id}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'reject',
          rejection_reason: rejectReason.trim(),
          internal_note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('approvals.rejectFailed'));
      setDecision(data.decision);
      setRejectOpen(false);
      toast.success(t('approvals.rejectSuccess'));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ops-approvals-changed'));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authorized || isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !decision) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('approvals.notFound')}</p>
          <Link href="/approvals" className="text-sm font-semibold text-brand-primary underline dark:text-brand-secondary">
            {t('approvals.backToList')}
          </Link>
        </div>
      </AppShell>
    );
  }

  const status = STATUS_STYLES[decision.status] || STATUS_STYLES.pending;
  const StatusIcon = status.icon;
  const isPending = decision.status === 'pending';
  const submittedAt = decision.submission_date || decision.created_at;

  return (
    <AppShell>
      <div className="py-4 sm:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/approvals')}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <HiOutlineArrowLeft className="h-4 w-4" />
            {t('approvals.backToList')}
          </button>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {t(status.label)}
          </span>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-brand-secondary/20 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.06] to-brand-secondary/[0.08] px-4 py-3.5 dark:border-slate-700 dark:from-brand-primary/15 dark:to-brand-secondary/10 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                  {decision.shareholder_name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {decision.file_number || '—'} · FY {decision.fiscal_year}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-brand-secondary/15 px-2.5 py-1 text-[11px] font-semibold text-brand-primary dark:text-brand-secondary">
              {t(DECISION_LABELS[decision.decision_type] || 'decisions.withdraw')}
            </span>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <InfoRow icon={HiOutlineHashtag} label={t('approvals.regNo')} value={decision.reg_no} />
            <InfoRow icon={HiOutlineUser} label={t('profile.nationalId')} value={decision.national_id} />
            <InfoRow icon={HiOutlinePhone} label={t('decisions.phone')} value={decision.phone} />
            <InfoRow icon={HiOutlineEnvelope} label={t('decisions.email')} value={decision.email || '—'} />
            <InfoRow
              icon={HiOutlineCalendarDays}
              label={t('decisions.submitted')}
              value={submittedAt ? new Date(submittedAt).toLocaleString() : '—'}
            />
            <InfoRow
              icon={HiOutlineDocumentText}
              label={t('decisions.decisionType')}
              value={t(DECISION_LABELS[decision.decision_type] || 'decisions.withdraw')}
            />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <StatCard
            label={t('decisions.amountToConvert')}
            value={`${fmt(decision.amount_to_convert || 0)} ETB`}
            accent="primary"
          />
          <StatCard
            label={t('decisions.amountToWithdraw')}
            value={decision.amount_to_withdraw != null ? `${fmt(decision.amount_to_withdraw)} ETB` : '—'}
            accent="secondary"
          />
          <StatCard
            label={t('decisions.paymentMethod')}
            value={
              decision.payment_method === 'bank-transfer'
                ? t('decisions.bankTransfer')
                : decision.payment_method === 'check'
                  ? t('decisions.check')
                  : '—'
            }
            accent="neutral"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {decision.payment_method === 'bank-transfer' && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <HiOutlineBuildingLibrary className="h-4 w-4 text-brand-secondary" />
              {t('detail.paymentDetails')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoRow label={t('decisions.bank')} value={decision.bank_name} />
              <InfoRow label={t('decisions.branch')} value={decision.branch_name || '—'} />
              <InfoRow label={t('decisions.accountNumber')} value={decision.account_number} />
            </div>
          </div>
        )}

        {decision.status === 'rejected' && decision.rejection_reason && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">{t('approvals.rejectionReason')}</p>
            <p className="mt-1">{decision.rejection_reason}</p>
          </div>
        )}

        {!isPending && decision.reviewed_at && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <p>{t('approvals.alreadyReviewed')}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {new Date(decision.reviewed_at).toLocaleString()}
              {decision.reviewed_by_name ? ` · ${decision.reviewed_by_name}` : ''}
            </p>
            {decision.internal_note && (
              <p className="mt-2 text-xs">
                <span className="font-semibold">{t('approvals.internalNote')}:</span> {decision.internal_note}
              </p>
            )}
          </div>
        )}

        {isPending && (
          <div className="overflow-hidden rounded-xl border border-brand-primary/15 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.05] to-brand-secondary/[0.06] px-4 py-3 dark:border-slate-700 sm:px-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('approvals.actionsTitle')}</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('approvals.actionsSubtitle')}</p>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('approvals.internalNote')} <span className="font-normal text-slate-400">({t('fill.optional')})</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  disabled={isSubmitting}
                  placeholder={t('approvals.internalNotePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              {!rejectOpen ? (
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setRejectOpen(true)}
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                  >
                    <HiOutlineXCircle className="h-5 w-5" />
                    {t('approvals.reject')}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="inline-flex min-h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-primary-hover disabled:opacity-60"
                  >
                    <HiOutlineCheckCircle className="h-5 w-5" />
                    {isSubmitting ? t('common.saving') : t('approvals.approve')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-3 dark:border-red-800 dark:bg-red-950/30 sm:p-4">
                  <label className="mb-1 block text-xs font-semibold text-red-700 dark:text-red-300">
                    {t('approvals.rejectReason')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    placeholder={t('approvals.rejectReasonPlaceholder')}
                    className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/15 disabled:opacity-60 dark:border-red-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectOpen(false);
                        setRejectReason('');
                      }}
                      disabled={isSubmitting}
                      className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {t('password.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      <HiOutlineXCircle className="h-5 w-5" />
                      {isSubmitting ? t('common.saving') : t('approvals.confirmReject')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3 w-3 text-brand-secondary" />}
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value || '—'}</p>
    </div>
  );
}

function StatCard({ label, value, accent = 'neutral', className = '' }) {
  const accentClass =
    accent === 'primary'
      ? 'border-brand-primary/20 from-brand-primary/[0.06] to-white dark:from-brand-primary/20'
      : accent === 'secondary'
        ? 'border-brand-secondary/25 from-brand-secondary-soft to-white dark:from-brand-secondary/10'
        : 'border-slate-200 from-slate-50 to-white dark:border-slate-700 dark:from-slate-800';

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-3.5 ${accentClass} ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-white sm:text-base">{value}</p>
    </div>
  );
}
