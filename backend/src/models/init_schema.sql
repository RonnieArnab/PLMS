-- ==========================================
-- Loan Management System Schema (PostgreSQL) - Cleaned + UUID keys + refresh_token
-- ==========================================

-- Enable UUID generation (pgcrypto provides gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if already exist (order handled by CASCADE)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS repaymentschedule CASCADE;
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
    role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    phone_number VARCHAR(20),
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================== CUSTOMER PROFILE ==================
-- Note: user_id is UNIQUE to enforce 1:1 relationship with users when role = 'CUSTOMER'
CREATE TABLE customerprofile (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    aadhaar_no VARCHAR(20) UNIQUE,
    pan_no VARCHAR(20) UNIQUE,
    profession VARCHAR(100),
    years_experience INT CHECK (years_experience >= 0),
    annual_income NUMERIC(12,2) CHECK (annual_income >= 0),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING','VERIFIED','REJECTED')),
    address TEXT,
    account_id UUID, -- FK added later (to avoid circular creation)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- ================== BANK ACCOUNTS ==================
CREATE TABLE bank_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customerprofile(customer_id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150),
    ifsc_code VARCHAR(20),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add FK from customerprofile.account_id to bank_accounts.account_id (nullable, ON DELETE SET NULL)
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
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid >= 0),
    payment_method VARCHAR(50),
    payment_type VARCHAR(50),
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

-- ================== INDEXES ==================
CREATE INDEX idx_users_email ON users(email);
-- customer-specific unique identifiers indexed on customerprofile
CREATE INDEX idx_customer_aadhaar ON customerprofile(aadhaar_no);
CREATE INDEX idx_customer_pan ON customerprofile(pan_no);

CREATE INDEX idx_loans_user ON loanapplications(user_id);
CREATE INDEX idx_loans_product ON loanapplications(product_id);
CREATE INDEX idx_docs_loan ON documents(loan_id);
CREATE INDEX idx_repayments_loan ON repaymentschedule(loan_id);
CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ================== OPTIONAL: trigger to update updated_at on users ==================
-- Create function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to users (keeps updated_at current)
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
