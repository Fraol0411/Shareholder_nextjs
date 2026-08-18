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
  file_number VARCHAR(50) NOT NULL,
  shareholder_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  fiscal_year VARCHAR(20) NOT NULL,
  decision_type VARCHAR(20) NOT NULL,
  amount_to_convert DECIMAL(18, 2),
  amount_to_withdraw DECIMAL(18, 2),
  payment_method VARCHAR(50),
  bank_name VARCHAR(255),
  branch_name VARCHAR(255),
  account_number VARCHAR(100),
  entered_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dividend_decisions_created_at ON dividend_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dividend_decisions_entered_by ON dividend_decisions(entered_by);
