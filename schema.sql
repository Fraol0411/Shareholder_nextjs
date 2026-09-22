-- PostgreSQL schema for Sharehoder database
-- Run: psql -U postgres -d Sharehoder -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('staff', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dividend_decisions (
  id SERIAL PRIMARY KEY,
  file_number VARCHAR(50),
  shareholder_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  fiscal_year VARCHAR(20) NOT NULL,
  decision_type VARCHAR(20) NOT NULL CHECK (decision_type IN ('withdraw', 'fiscalreinvest', 'reinvest')),
  amount_to_convert DECIMAL(18, 2) CHECK (amount_to_convert IS NULL OR amount_to_convert >= 0),
  amount_to_withdraw DECIMAL(18, 2) CHECK (amount_to_withdraw IS NULL OR amount_to_withdraw >= 0),
  payment_method VARCHAR(50),
  bank_name VARCHAR(255),
  branch_name VARCHAR(255),
  account_number VARCHAR(100),
  entered_by INTEGER REFERENCES users(id),
  user_id INTEGER REFERENCES users(id),
  sh_dividend_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (decision_type = 'withdraw' AND amount_to_withdraw IS NOT NULL AND amount_to_withdraw > 0)
    OR (decision_type IN ('reinvest', 'fiscalreinvest'))
  )
);

CREATE OR REPLACE FUNCTION public.validate_dividend_decision_balance()
RETURNS trigger AS $$
DECLARE
  available_balance NUMERIC(18,2);
  convert_amount NUMERIC(18,2);
  withdraw_amount NUMERIC(18,2);
BEGIN
  IF NEW.sh_dividend_id IS NOT NULL THEN
    SELECT total_dividend INTO available_balance
    FROM public.sh_dividend
    WHERE id = NEW.sh_dividend_id;
  ELSIF NEW.user_id IS NOT NULL AND NEW.fiscal_year IS NOT NULL THEN
    SELECT total_dividend INTO available_balance
    FROM public.sh_dividend
    WHERE user_id = NEW.user_id AND fiscal_year = NEW.fiscal_year
    ORDER BY id DESC
    LIMIT 1;
  END IF;

  IF available_balance IS NULL THEN
    RAISE EXCEPTION 'No dividend balance exists for the selected user and fiscal year.';
  END IF;

  convert_amount := COALESCE(NEW.amount_to_convert, 0);
  withdraw_amount := COALESCE(NEW.amount_to_withdraw, 0);

  IF NEW.decision_type IN ('reinvest', 'fiscalreinvest') THEN
    IF convert_amount > available_balance THEN
      RAISE EXCEPTION 'Reinvestment amount (%) exceeds the available balance (%).', convert_amount, available_balance;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.decision_type = 'withdraw' THEN
    IF withdraw_amount <= 0 THEN
      RAISE EXCEPTION 'Withdrawal amount must be greater than zero.';
    END IF;

    IF convert_amount + withdraw_amount > available_balance THEN
      RAISE EXCEPTION 'Total reinvested and withdrawn amount (%) exceeds the available balance (%).', convert_amount + withdraw_amount, available_balance;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_dividend_decision_balance ON public.dividend_decisions;
CREATE TRIGGER trg_validate_dividend_decision_balance
BEFORE INSERT OR UPDATE ON public.dividend_decisions
FOR EACH ROW
EXECUTE FUNCTION public.validate_dividend_decision_balance();

CREATE INDEX IF NOT EXISTS idx_dividend_decisions_created_at ON dividend_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dividend_decisions_entered_by ON dividend_decisions(entered_by);
