-- create_schema_final_simple.sql
-- Clean, unified PostgreSQL schema for PLMS (destructive: drops tables first)
-- WARNING: destructive. Back up your data before running.
BEGIN;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables in safe order (CASCADE to remove dependents)
DROP TABLE IF EXISTS kyc_records CASCADE;
DROP TABLE IF EXISTS kyc_files CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS repaymentschedule CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS loanapplications CASCADE;
DROP TABLE IF EXISTS loanproducts CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS customerprofile CASCADE;
DROP TABLE IF EXISTS adminprofile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================== USERS ==================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    aadhaar_no VARCHAR(20) UNIQUE,
    pan_no VARCHAR(20) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER','ADMIN')),
    phone_number VARCHAR(20),
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== ADMIN PROFILE ==================
CREATE TABLE adminprofile (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== CUSTOMER PROFILE ==================
CREATE TABLE customerprofile (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    aadhaar_no VARCHAR(20) UNIQUE,
    pan_no VARCHAR(20) UNIQUE,
    profession VARCHAR(100),
    years_experience INT CHECK (years_experience >= 0),
    annual_income NUMERIC(12,2) CHECK (annual_income >= 0),

    -- Per-document KYC statuses
    aadhaar_kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (aadhaar_kyc_status IN ('PENDING','VERIFIED','REJECTED','NEEDS_REVIEW','AUTO_APPROVED')),
    pan_kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (pan_kyc_status IN ('PENDING','VERIFIED','REJECTED','NEEDS_REVIEW','AUTO_APPROVED')),

    -- Backwards-compatible overall status
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING','VERIFIED','REJECTED','NEEDS_REVIEW','AUTO_APPROVED')),

    address TEXT,
    account_id UUID, -- added later as FK to bank_accounts
    latest_kyc_id UUID,
    latest_aadhaar_kyc_id UUID,
    latest_pan_kyc_id UUID,
    nominee VARCHAR(150),
    nominee_contact VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== BANK ACCOUNTS ==================
CREATE TABLE bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customerprofile(customer_id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150),
    ifsc_code VARCHAR(20),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK from customerprofile.account_id -> bank_accounts.account_id (nullable)
ALTER TABLE customerprofile
  ADD CONSTRAINT fk_customer_account FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id) ON DELETE SET NULL;

-- ================== LOAN PRODUCTS ==================
CREATE TABLE loanproducts (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    target_profession VARCHAR(100),
    min_amount NUMERIC(12,2) NOT NULL CHECK (min_amount >= 0),
    max_amount NUMERIC(12,2) NOT NULL CHECK (max_amount >= min_amount),
    min_tenure INT NOT NULL CHECK (min_tenure > 0),
    max_tenure INT NOT NULL CHECK (max_tenure >= min_tenure),
    base_interest_apr NUMERIC(5,2) NOT NULL CHECK (base_interest_apr >= 0),
    processing_fee_pct NUMERIC(5,2) DEFAULT 0 CHECK (processing_fee_pct >= 0),
    prepayment_allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== LOAN APPLICATIONS ==================
CREATE TABLE loanapplications (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES loanproducts(product_id),
    loan_amount NUMERIC(12,2) NOT NULL CHECK (loan_amount >= 0),
    tenure_months INT NOT NULL CHECK (tenure_months > 0),
    application_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (application_status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','DISBURSED','CLOSED')),
    approved_amount NUMERIC(12,2),
    interest_rate_apr NUMERIC(5,2),
    processing_fee NUMERIC(12,2),
    risk_grade VARCHAR(10),
    applied_date DATE DEFAULT CURRENT_DATE,
    approved_date DATE,
    disbursement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== DOCUMENTS ==================
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    uploaded_by_user UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== REPAYMENT SCHEDULE ==================
CREATE TABLE repaymentschedule (
    repayment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    installment_no INT NOT NULL CHECK (installment_no > 0),
    due_date DATE NOT NULL,
    principal_due NUMERIC(12,2) DEFAULT 0 CHECK (principal_due >= 0),
    interest_due NUMERIC(12,2) DEFAULT 0 CHECK (interest_due >= 0),
    total_due NUMERIC(12,2) GENERATED ALWAYS AS (principal_due + interest_due) STORED,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','OVERDUE'))
);

-- ================== PAYMENTS ==================
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repayment_id UUID REFERENCES repaymentschedule(repayment_id) ON DELETE CASCADE,
    loan_id UUID NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid >= 0),
    payment_method VARCHAR(50),
    payment_type VARCHAR(50) DEFAULT 'GENERAL',
    allocated_principal NUMERIC(12,2) DEFAULT 0 CHECK (allocated_principal >= 0),
    allocated_interest NUMERIC(12,2) DEFAULT 0 CHECK (allocated_interest >= 0),
    allocated_fees NUMERIC(12,2) DEFAULT 0 CHECK (allocated_fees >= 0),
    transaction_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== NOTIFICATIONS ==================
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    channel VARCHAR(50) DEFAULT 'EMAIL',
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== KYC FILES ==================
CREATE TABLE kyc_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  customer_id UUID NULL REFERENCES customerprofile(customer_id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  original_filename TEXT,
  stored_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime TEXT,
  size_bytes BIGINT,
  xml_content TEXT NULL,
  sha256 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================== KYC RECORDS ==================
CREATE TABLE kyc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  customer_id UUID NULL REFERENCES customerprofile(customer_id) ON DELETE CASCADE,
  kyc_type TEXT NOT NULL CHECK (kyc_type IN ('AADHAAR','PAN')),
  source TEXT NOT NULL CHECK (source IN ('pdf','zip')),
  file_id UUID NULL REFERENCES kyc_files(id) ON DELETE SET NULL,
  xml_file_id UUID NULL REFERENCES kyc_files(id) ON DELETE SET NULL,
  parsed_json JSONB,
  confidence_score INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','VERIFIED','REJECTED','NEEDS_REVIEW','AUTO_APPROVED')),
  reviewer_id UUID NULL REFERENCES adminprofile(admin_id),
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Customerprofile -> latest KYC references (nullable)
ALTER TABLE customerprofile
  ADD CONSTRAINT fk_customer_latest_kyc FOREIGN KEY (latest_kyc_id) REFERENCES kyc_records(id) ON DELETE SET NULL;

ALTER TABLE customerprofile
  ADD CONSTRAINT fk_customer_latest_aadhaar_kyc FOREIGN KEY (latest_aadhaar_kyc_id) REFERENCES kyc_records(id) ON DELETE SET NULL;

ALTER TABLE customerprofile
  ADD CONSTRAINT fk_customer_latest_pan_kyc FOREIGN KEY (latest_pan_kyc_id) REFERENCES kyc_records(id) ON DELETE SET NULL;

-- ================== INDEXES ==================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_customer_aadhaar ON customerprofile(aadhaar_no);
CREATE INDEX idx_customer_pan ON customerprofile(pan_no);
CREATE INDEX idx_loans_user ON loanapplications(user_id);
CREATE INDEX idx_loans_product ON loanapplications(product_id);
CREATE INDEX idx_docs_loan ON documents(loan_id);
CREATE INDEX idx_repayments_loan ON repaymentschedule(loan_id);
CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE INDEX idx_kyc_files_user ON kyc_files(user_id);
CREATE INDEX idx_kyc_files_customer ON kyc_files(customer_id);
CREATE INDEX idx_kyc_records_user ON kyc_records(user_id);
CREATE INDEX idx_kyc_records_customer ON kyc_records(customer_id);
CREATE INDEX idx_kyc_records_status ON kyc_records(status);
CREATE INDEX idx_kyc_records_type ON kyc_records(kyc_type);

-- ================== TRIGGER: update users.updated_at ==================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ================== SEED: loanproducts ==================
DELETE FROM loanproducts WHERE name IN (
  'Personal Loan', 'Home Loan', 'Doctor Equipment Loan', 'Small Business Loan', 'Education Loan', 'Vehicle Loan', 'Lawyer Practice Loan'
);

INSERT INTO loanproducts
  (name, target_profession, min_amount, max_amount, min_tenure, max_tenure, base_interest_apr, processing_fee_pct, prepayment_allowed)
VALUES
  ('Personal Loan',           'All Professionals',  50000,   500000,    12,  60, 12.5, 1.5, TRUE),
  ('Home Loan',               'All Professionals', 2000000, 10000000,   60, 240,  8.75, 0.5, TRUE),
  ('Doctor Equipment Loan',   'Doctors',           100000,  2000000,    12,  48, 11.5, 1.2, TRUE),
  ('Small Business Loan',     'Entrepreneurs',     100000,  5000000,    12,  72, 13.0, 2.0, FALSE),
  ('Education Loan',          'Students',           50000,  1000000,    12,  84, 10.0, 0.0, TRUE),
  ('Vehicle Loan',            'All Professionals',  200000,  1500000,    12,  60,  9.5, 1.0, TRUE),
  ('Lawyer Practice Loan',    'Lawyers',           100000,  3000000,    12,  60, 12.0, 1.8, FALSE);

COMMIT;

-- End of script
