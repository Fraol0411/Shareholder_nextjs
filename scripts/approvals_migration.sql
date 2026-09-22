-- Approval audit columns for dividend_decisions
-- Safe to re-run (IF NOT EXISTS / idempotent updates)

ALTER TABLE public.dividend_decisions
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT;

-- Normalize empty/null status to pending (awaiting admin approval)
UPDATE public.dividend_decisions
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

-- Optional: align legacy "processed" with approvals vocabulary
UPDATE public.dividend_decisions
SET status = 'approved'
WHERE lower(btrim(status)) = 'processed';
