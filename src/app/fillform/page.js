'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineCreditCard,
  HiOutlineEnvelope,
  HiOutlineExclamationCircle,
  HiOutlineBanknotes,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineWallet,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineBuildingLibrary,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { FaCheck } from 'react-icons/fa';
import AppShell from '../../components/AppShell';
import { getToken, getStoredUser } from '../../libs/auth';
import { useTranslation } from '../../components/LanguageProvider';

const fmt = (v) =>
  Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const buildBalanceError = ({ availableBalance, amountToConvert, amountToWithdraw, t }) => {
  const convert = toNumber(amountToConvert);
  const withdraw = toNumber(amountToWithdraw);

  if (convert < 0 || withdraw < 0) {
    return t('staff.negativeAmountError');
  }

  if (withdraw > 0 && convert + withdraw > availableBalance + 0.000001) {
    return `${t('staff.totalExceedsBalance')} ${fmt(convert + withdraw)} ETB ${t('staff.exceedsBalanceDivider')} ${fmt(availableBalance)} ETB.`;
  }

  if (convert > availableBalance + 0.000001) {
    return `${t('staff.reinvestmentExceedsBalance')} ${fmt(convert)} ETB ${t('staff.exceedsBalanceDivider')} ${fmt(availableBalance)} ETB.`;
  }

  if (withdraw > availableBalance + 0.000001) {
    return `${t('staff.withdrawalExceedsBalance')} ${fmt(withdraw)} ETB ${t('staff.exceedsBalanceDivider')} ${fmt(availableBalance)} ETB.`;
  }

  return '';
};

export default function ShareholderFillForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [dividendData, setDividendData] = useState(null);
  const [loadingDividend, setLoadingDividend] = useState(false);

  const [shareholderName, setShareholderName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [decision, setDecision] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountToConvert, setAmountToConvert] = useState('');
  const [amountToWithdraw, setAmountToWithdraw] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [myDecisions, setMyDecisions] = useState([]);

  const existingDecision = myDecisions.find(
    (item) => String(item.fiscal_year) === String(selectedYear)
  );

  const availableBalance = toNumber(dividendData?.total_dividend);
  const availableToReinvest =
    amountToWithdraw === ''
      ? availableBalance
      : Math.max(availableBalance - toNumber(amountToWithdraw), 0);
  const availableToWithdraw =
    amountToConvert === ''
      ? availableBalance
      : Math.max(availableBalance - toNumber(amountToConvert), 0);

  useEffect(() => {
    const authToken = getToken();
    const storedUser = getStoredUser();
    if (!authToken || !storedUser) {
      router.replace('/login');
      return;
    }
    setToken(authToken);
    setUser(storedUser);
    setShareholderName(storedUser.name || storedUser.username || '');
    setPhone(storedUser.phone || '');
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/shareholder-dividend`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setFiscalYears(data.fiscalYears || []))
      .catch(() => {});

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/decisions/my-decisions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMyDecisions(data.decisions || []))
      .catch(() => setMyDecisions([]));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedYear) return;
    setLoadingDividend(true);
    setDividendData(null);
    setFormOpen(false);

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/shareholder-dividend?fiscal_year=${encodeURIComponent(selectedYear)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        setDividendData(data.dividend || null);
        if (data.dividend?.shareholder_name) {
          setShareholderName(data.dividend.shareholder_name);
        }
        if (data.dividend?.phone) {
          setPhone(data.dividend.phone);
        }
      })
      .catch(() => setDividendData(null))
      .finally(() => setLoadingDividend(false));
  }, [token, selectedYear]);

  useEffect(() => {
    if (!formOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) setFormOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [formOpen, isSubmitting]);

  const resetDecisionFields = () => {
    setDecision('');
    setPaymentMethod('');
    setAmountToConvert('');
    setAmountToWithdraw('');
    setBankName('');
    setBranchName('');
    setAccountNumber('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!decision || !selectedYear) return;
    if (existingDecision) {
      toast.error(t('fill.alreadySubmittedDesc'));
      setFormOpen(false);
      return;
    }

    const currentBalance = Number(dividendData?.total_dividend || 0);
    const convertAmount = decision === 'withdraw' ? toNumber(amountToConvert) : currentBalance;
    const withdrawAmount = decision === 'withdraw' ? toNumber(amountToWithdraw) : 0;

    if (decision === 'withdraw') {
      if (!amountToWithdraw || withdrawAmount <= 0) {
        toast.error(t('staff.withdrawAmountRequired'));
        return;
      }
    }

    if (decision === 'withdraw') {
      const balanceError = buildBalanceError({
        availableBalance: currentBalance,
        amountToConvert: amountToConvert || 0,
        amountToWithdraw: amountToWithdraw || 0,
        t,
      });

      if (balanceError) {
        toast.error(balanceError);
        return;
      }
    }

    if (['reinvest', 'fiscalreinvest'].includes(decision)) {
      if (currentBalance <= 0) {
        toast.error(t('staff.noAvailableBalance'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/decisions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_number: dividendData?.file_number || null,
          shareholder_name: shareholderName,
          email: email || null,
          phone: phone || null,
          fiscal_year: selectedYear,
          decision_type: decision,
          amount_to_convert: ['reinvest', 'fiscalreinvest'].includes(decision)
            ? convertAmount
            : amountToConvert || null,
          amount_to_withdraw: decision === 'withdraw' ? withdrawAmount : null,
          payment_method: paymentMethod || null,
          bank_name: bankName || null,
          branch_name: branchName || null,
          account_number: accountNumber || null,
          sh_dividend_id: dividendData?.sh_dividend_id || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || t('fill.errorToast'));

      resetDecisionFields();
      setFormOpen(false);
      if (result.decision) {
        setMyDecisions((prev) => [result.decision, ...prev]);
      } else {
        setMyDecisions((prev) => [
          {
            fiscal_year: selectedYear,
            decision_type: decision,
            amount_to_convert: ['reinvest', 'fiscalreinvest'].includes(decision)
              ? convertAmount
              : amountToConvert || null,
            amount_to_withdraw: decision === 'withdraw' ? withdrawAmount : null,
            payment_method: paymentMethod || null,
            status: 'pending',
          },
          ...prev,
        ]);
      }

      toast.success(t('fill.successToast'), {
        description: t('dashboard.submitted'),
        action: {
          label: t('fill.viewSubmissions'),
          onClick: () => router.push('/my-decisions'),
        },
      });
    } catch (err) {
      toast.error(err.message || t('staff.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-secondary/30 border-t-brand-secondary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 py-4 sm:gap-5 sm:py-6 lg:py-5">
        {/* Compact header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-secondary">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-secondary/15 text-[10px] text-brand-primary dark:text-brand-secondary">
                1
              </span>
              {t('fill.stepReview')}
            </div>
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {t('fill.title')}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              {t('fill.readyToDecide')}
            </p>
          </div>

          <div className="w-full shrink-0 sm:w-56 lg:w-64">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('staff.selectFiscalYear')}
            </label>
            {fiscalYears.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3.5 py-2.5 text-sm text-slate-400 dark:border-slate-700">
                {t('fill.noFiscalYears')}
              </p>
            ) : (
              <FiscalYearDropdown
                years={fiscalYears}
                selected={selectedYear}
                onSelect={setSelectedYear}
              />
            )}
          </div>
        </div>

        {/* Empty / loading / missing states */}
        {!selectedYear && (
          <EmptyState
            icon={HiOutlineCalendarDays}
            title={t('fill.selectYearFirst')}
            description={t('fill.subtitle')}
          />
        )}

        {selectedYear && loadingDividend && (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-brand-secondary/20 bg-white/80 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-secondary/25 border-t-brand-secondary" />
              {t('fill.loadingSummary')}
            </div>
          </div>
        )}

        {selectedYear && !loadingDividend && !dividendData && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
            <HiOutlineExclamationCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              {t('fill.noDividendRecord')} {selectedYear}.
            </p>
          </div>
        )}

        {/* Compact summary + CTA */}
        {dividendData && !loadingDividend && (
          <>
            <section className="overflow-hidden rounded-2xl border border-brand-secondary/20 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-primary/[0.06] via-white to-brand-secondary/[0.08] px-4 py-3 dark:border-slate-700 dark:from-brand-primary/20 dark:via-slate-800 dark:to-brand-secondary/10 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm shadow-brand-primary/30">
                    <HiOutlineChartBar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                      {t('fill.dividendSummary')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      FY {dividendData.fiscal_year}
                      {dividendData.file_number
                        ? ` · ${t('fill.fileNumber')} ${dividendData.file_number}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="rounded-full bg-brand-secondary/15 px-3 py-1 text-xs font-semibold text-brand-primary dark:text-brand-secondary">
                  {t('fill.balanceLabel')}: {fmt(dividendData.total_dividend)} ETB
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700 lg:grid-cols-4">
                <Metric
                  icon={HiOutlineWallet}
                  label={t('dashboard.paidCapital')}
                  value={fmt(dividendData.paidup_capital)}
                />
                <Metric
                  icon={HiOutlineChartBar}
                  label={t('dashboard.grossDividend')}
                  value={fmt(dividendData.dividend_declared)}
                />
                <Metric
                  icon={HiOutlineArrowPath}
                  label={t('dashboard.broughtForward')}
                  value={fmt(dividendData.dividend_bf)}
                />
                <Metric
                  icon={HiOutlineBanknotes}
                  label={t('dashboard.totalDividend')}
                  value={fmt(dividendData.total_dividend)}
                  highlight
                />
              </div>
            </section>

            <section
              className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                existingDecision
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : 'border-brand-primary/15 bg-gradient-to-br from-brand-primary to-brand-primary-hover text-white shadow-brand-primary/25'
              }`}
            >
              <div className="min-w-0">
                <div
                  className={`mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    existingDecision ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-secondary'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      existingDecision ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300' : 'bg-white/15'
                    }`}
                  >
                    2
                  </span>
                  {t('fill.stepDecide')}
                </div>
                <h3 className="text-lg font-bold sm:text-xl">
                  {existingDecision ? t('fill.alreadySubmittedTitle') : t('fill.makeDecision')}
                </h3>
                <p className={`mt-0.5 text-sm ${existingDecision ? 'text-emerald-800/80 dark:text-emerald-200/80' : 'text-white/70'}`}>
                  {existingDecision
                    ? t('fill.alreadySubmittedDesc')
                    : t('fill.modalSubtitle')}
                </p>
                {existingDecision && (
                  <p className="mt-2 text-xs font-semibold">
                    {t('fill.submittedDecisionType')}:{' '}
                    {existingDecision.decision_type === 'reinvest'
                      ? t('decisions.reinvest')
                      : existingDecision.decision_type === 'fiscalreinvest'
                        ? t('decisions.fiscalReinvest')
                        : t('decisions.withdraw')}
                  </p>
                )}
              </div>
              {existingDecision ? (
                <button
                  type="button"
                  onClick={() => router.push('/my-decisions')}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  <HiOutlineCheckCircle className="h-5 w-5" />
                  {t('fill.viewMyDecision')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-secondary px-5 text-sm font-bold text-white shadow-md shadow-brand-secondary/30 transition hover:bg-brand-secondary-hover active:scale-[0.98]"
                >
                  <HiOutlineDocumentText className="h-5 w-5" />
                  {t('fill.openForm')}
                </button>
              )}
            </section>
          </>
        )}
      </div>

      {/* Decision modal */}
      {formOpen && dividendData && !existingDecision && (
        <DecisionModal
          t={t}
          onClose={() => !isSubmitting && setFormOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          selectedYear={selectedYear}
          availableBalance={availableBalance}
          availableToReinvest={availableToReinvest}
          availableToWithdraw={availableToWithdraw}
          shareholderName={shareholderName}
          setShareholderName={setShareholderName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          decision={decision}
          setDecision={setDecision}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          amountToConvert={amountToConvert}
          setAmountToConvert={setAmountToConvert}
          amountToWithdraw={amountToWithdraw}
          setAmountToWithdraw={setAmountToWithdraw}
          bankName={bankName}
          setBankName={setBankName}
          branchName={branchName}
          setBranchName={setBranchName}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
        />
      )}
    </AppShell>
  );
}

function DecisionModal({
  t,
  onClose,
  onSubmit,
  isSubmitting,
  selectedYear,
  availableBalance,
  availableToReinvest,
  availableToWithdraw,
  shareholderName,
  setShareholderName,
  phone,
  setPhone,
  email,
  setEmail,
  decision,
  setDecision,
  paymentMethod,
  setPaymentMethod,
  amountToConvert,
  setAmountToConvert,
  amountToWithdraw,
  setAmountToWithdraw,
  bankName,
  setBankName,
  branchName,
  setBranchName,
  accountNumber,
  setAccountNumber,
}) {
  // 1 = choose, 2 = withdraw details, 3 = bank details
  const [step, setStep] = useState(1);

  const options = [
    {
      value: 'reinvest',
      title: t('form.reinvestFull'),
      help: t('form.reinvestFullHelp'),
    },
    {
      value: 'fiscalreinvest',
      title: t('form.reinvestYear'),
      help: t('form.reinvestYearHelp'),
    },
    {
      value: 'withdraw',
      title: t('form.withdraw'),
      help: t('form.withdrawHelp'),
    },
  ];

  const selectedOption = options.find((option) => option.value === decision);

  const stepMeta = {
    1: { title: t('fill.modalTitle'), subtitle: t('fill.modalSubtitle') },
    2: { title: t('fill.stepWithdraw'), subtitle: selectedOption?.title || t('form.withdraw') },
    3: { title: t('fill.stepPayment'), subtitle: t('form.bankTransfer') },
  };

  const handleDecisionPick = (value) => {
    setDecision(value);
    if (value !== 'withdraw') {
      setPaymentMethod('');
      setAmountToConvert('');
      setAmountToWithdraw('');
      setBankName('');
      setBranchName('');
      setAccountNumber('');
    }
  };

  const goBack = () => {
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    onClose();
  };

  const handlePrimaryClick = (event) => {
    if (step === 1) {
      event.preventDefault();
      if (!decision) return;
      if (decision === 'withdraw') {
        setStep(2);
        return;
      }
      onSubmit(event);
      return;
    }

    if (step === 2) {
      if (paymentMethod === 'bank-transfer') {
        event.preventDefault();
        setStep(3);
        return;
      }
      // check (or empty) — let form submit validation run
      return;
    }
  };

  const primaryLabel =
    step === 1 && decision === 'withdraw'
      ? t('fill.continue')
      : step === 2 && paymentMethod === 'bank-transfer'
        ? t('fill.continue')
        : t('fill.confirmSubmit');

  const primaryDisabled =
    isSubmitting ||
    (step === 1 && !decision) ||
    (step === 2 && (!amountToWithdraw || !paymentMethod)) ||
    (step === 3 && (!bankName || !accountNumber));

  const inputCls =
    'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label={t('fill.closeForm')}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1.5">
              {[1, 2, 3].map((n) => {
                const visible = n === 1 || decision === 'withdraw';
                if (!visible && n > 1) return null;
                if (n === 3 && paymentMethod !== 'bank-transfer' && step < 3) return null;
                const active = step === n;
                const done = step > n;
                return (
                  <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all ${
                      active ? 'w-6 bg-brand-secondary' : done ? 'w-4 bg-brand-primary' : 'w-4 bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-secondary">
              FY {selectedYear} · {fmt(availableBalance)} ETB
            </p>
            <h2
              id="decision-modal-title"
              className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white"
            >
              {stepMeta[step].title}
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {stepMeta[step].subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {step === 1 && (
              <div className="space-y-4">
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <HiOutlineUser className="h-4 w-4 text-brand-secondary" />
                    {t('fill.stepContact')}
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field
                      label={t('profile.name')}
                      icon={HiOutlineUser}
                      value={shareholderName}
                      onChange={setShareholderName}
                      required
                    />
                    <Field
                      label={t('dashboard.phone')}
                      icon={HiOutlinePhone}
                      value={phone}
                      onChange={setPhone}
                      type="tel"
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label={`${t('dashboard.email')} (${t('fill.optional')})`}
                        icon={HiOutlineEnvelope}
                        value={email}
                        onChange={setEmail}
                        type="email"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <HiOutlineDocumentText className="h-4 w-4 text-brand-secondary" />
                    {t('fill.chooseOption')}
                  </h3>
                  <div className="space-y-2">
                    {options.map((option) => {
                      const active = decision === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleDecisionPick(option.value)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                            active
                              ? 'border-brand-secondary bg-brand-secondary-soft ring-2 ring-brand-secondary/25 dark:bg-brand-secondary/10'
                              : 'border-slate-200 hover:border-brand-secondary/40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              active
                                ? 'border-brand-secondary bg-brand-secondary text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {active && <FaCheck className="text-[9px]" />}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                              {option.title}
                            </span>
                            <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                              {option.help}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-brand-secondary/20 bg-brand-secondary-soft/50 px-3 py-2 text-xs text-slate-600 dark:border-brand-secondary/20 dark:bg-brand-secondary/10 dark:text-slate-300">
                  <span className="font-semibold text-brand-primary dark:text-brand-secondary">
                    {t('fill.selectedDecision')}:
                  </span>{' '}
                  {selectedOption?.title}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('form.partialReinvest')}
                  </label>
                  <input
                    type="number"
                    value={amountToConvert}
                    onChange={(e) => setAmountToConvert(e.target.value)}
                    placeholder={t('dashboard.amountPlaceholder')}
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t('dashboard.maximum')}: ETB {fmt(availableToReinvest)}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('form.cashAmount')}
                  </label>
                  <input
                    type="number"
                    value={amountToWithdraw}
                    onChange={(e) => setAmountToWithdraw(e.target.value)}
                    placeholder={t('dashboard.amountPlaceholder')}
                    required
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {t('dashboard.maximum')}: ETB {fmt(availableToWithdraw)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {t('staff.paymentMethod')} <span className="text-red-500">*</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank-transfer')}
                      className={`rounded-xl border p-3 text-left transition ${
                        paymentMethod === 'bank-transfer'
                          ? 'border-brand-secondary bg-brand-secondary-soft ring-2 ring-brand-secondary/20 dark:bg-brand-secondary/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <HiOutlineBuildingLibrary className="mb-1.5 h-5 w-5 text-brand-secondary" />
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {t('form.bankTransfer')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('check')}
                      className={`rounded-xl border p-3 text-left transition ${
                        paymentMethod === 'check'
                          ? 'border-brand-secondary bg-brand-secondary-soft ring-2 ring-brand-secondary/20 dark:bg-brand-secondary/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <HiOutlineCreditCard className="mb-1.5 h-5 w-5 text-brand-secondary" />
                      <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {t('form.check')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl border border-brand-secondary/20 bg-brand-secondary-soft/50 px-3 py-2 text-xs text-slate-600 dark:border-brand-secondary/20 dark:bg-brand-secondary/10 dark:text-slate-300">
                  <span className="font-semibold text-brand-primary dark:text-brand-secondary">
                    {t('form.bankTransfer')}
                  </span>
                  {' · '}
                  {fmt(toNumber(amountToWithdraw))} ETB
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('dashboard.bankName')}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t('dashboard.bankName')}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('dashboard.branchName')}
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder={t('dashboard.branchName')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('dashboard.accountNumber')}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t('dashboard.accountNumber')}
                    required
                    className={inputCls}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-slate-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900 sm:px-5">
            <button
              type="button"
              onClick={goBack}
              disabled={isSubmitting}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {step > 1 && <HiOutlineArrowLeft className="h-4 w-4" />}
              {step > 1 ? t('fill.back') : t('fill.closeForm')}
            </button>
            <button
              type={
                (step === 1 && decision !== 'withdraw') ||
                (step === 2 && paymentMethod === 'check') ||
                step === 3
                  ? 'submit'
                  : 'button'
              }
              onClick={handlePrimaryClick}
              disabled={primaryDisabled}
              className="inline-flex min-h-11 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-bold text-white shadow-lg shadow-brand-primary/25 transition hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('dashboard.submitting')}
                </>
              ) : (
                <>
                  {primaryLabel === t('fill.continue') ? null : (
                    <HiOutlineCheckCircle className="h-5 w-5" />
                  )}
                  {primaryLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, highlight = false }) {
  return (
    <div
      className={`bg-white p-3.5 sm:p-4 dark:bg-slate-800 ${
        highlight ? 'bg-gradient-to-br from-brand-secondary-soft to-white dark:from-brand-secondary/10 dark:to-slate-800' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[11px]">
        <Icon className={`h-3.5 w-3.5 ${highlight ? 'text-brand-secondary' : 'text-brand-primary/70'}`} />
        <span className="truncate">{label}</span>
      </div>
      <p
        className={`mt-1.5 text-base font-bold tabular-nums sm:text-lg ${
          highlight ? 'text-brand-primary dark:text-brand-secondary' : 'text-slate-900 dark:text-white'
        }`}
      >
        {value}
        <span className="ml-1 text-[10px] font-medium text-slate-400 sm:text-xs">ETB</span>
      </p>
    </div>
  );
}

function Field({ label, icon: Icon, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-secondary focus:ring-4 focus:ring-brand-secondary/15 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-brand-secondary/30 bg-white/70 px-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary-soft text-brand-primary dark:bg-brand-secondary/15 dark:text-brand-secondary">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 sm:text-sm">{description}</p>
    </div>
  );
}

function FiscalYearDropdown({ years, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const dropdownRef = useRef(null);
  const disabled = years.length === 0;
  const displayLabel = selected ? `FY ${selected}` : t('detail.selectYear');

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className={`flex w-full items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm font-medium shadow-sm outline-none transition focus:ring-2 focus:ring-brand-secondary/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-100 ${
          open
            ? 'border-brand-secondary ring-2 ring-brand-secondary/20'
            : 'border-slate-200 hover:border-brand-secondary/50 dark:border-slate-700'
        }`}
      >
        <HiOutlineCalendarDays className="h-4 w-4 shrink-0 text-brand-secondary" />
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            aria-label={t('detail.selectYear')}
            className="theme-surface absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border py-1 shadow-lg ring-1 ring-black/5"
          >
            {years.map((year) => {
              const isSelected = year === selected;
              return (
                <li
                  key={year}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => {
                    onSelect(year);
                    setOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(year);
                      setOpen(false);
                    }
                  }}
                  className={`flex min-h-10 cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'bg-brand-secondary-soft font-semibold text-brand-primary dark:bg-slate-700 dark:text-brand-secondary'
                      : 'text-slate-700 hover:bg-brand-secondary-soft/70 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>FY {year}</span>
                  {isSelected && <FaCheck className="text-xs text-brand-secondary" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
