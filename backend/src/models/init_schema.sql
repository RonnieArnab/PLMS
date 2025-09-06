-- ==========================================
-- Loan Management System Schema (PostgreSQL) - UUID keys + refresh_token
-- ==========================================

-- Enable UUID generation (pgcrypto provides gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables if already exist (for dev purposes) - order not important because of CASCADE
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS repaymentschedule CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS loanapplications CASCADE;
DROP TABLE IF EXISTS loanproducts CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS customerprofile CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================== USERS ==================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    phone_number VARCHAR(20),
    aadhaar_no VARCHAR(20) UNIQUE,
    pan_no VARCHAR(20) UNIQUE,
    refresh_token TEXT, -- newly added refresh token (can be NULL)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ================== CUSTOMER PROFILE ==================
CREATE TABLE customerprofile (
    customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    profession VARCHAR(100),
    years_experience INT,
    annual_income NUMERIC(12,2),
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    address TEXT,
    account_id UUID, -- references bank_accounts(account_id) (nullable to avoid circular creation issues)
    created_at TIMESTAMP DEFAULT NOW()
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- ================== LOAN PRODUCTS ==================
CREATE TABLE loanproducts (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    target_profession VARCHAR(100),
    min_amount NUMERIC(12,2) NOT NULL,
    max_amount NUMERIC(12,2) NOT NULL,
    min_tenure INT NOT NULL,
    max_tenure INT NOT NULL,
    base_interest_apr NUMERIC(5,2) NOT NULL,
    processing_fee_pct NUMERIC(5,2) DEFAULT 0,
    prepayment_allowed BOOLEAN DEFAULT TRUE
);

-- ================== LOAN APPLICATIONS ==================
CREATE TABLE loanapplications (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES loanproducts(product_id),
    loan_amount NUMERIC(12,2) NOT NULL,
    tenure_months INT NOT NULL,
    application_status VARCHAR(20) DEFAULT 'DRAFT',
    approved_amount NUMERIC(12,2),
    interest_rate_apr NUMERIC(5,2),
    processing_fee NUMERIC(12,2),
    risk_grade VARCHAR(10),
    applied_date DATE DEFAULT CURRENT_DATE,
    approved_date DATE,
    disbursement_date DATE
);

-- ================== DOCUMENTS ==================
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    uploaded_by_user UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ================== REPAYMENT SCHEDULE ==================
CREATE TABLE repaymentschedule (
    repayment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    installment_no INT NOT NULL,
    due_date DATE NOT NULL,
    principal_due NUMERIC(12,2),
    interest_due NUMERIC(12,2),
    total_due NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'PENDING'
);

-- ================== PAYMENTS ==================
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repayment_id UUID REFERENCES repaymentschedule(repayment_id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount_paid NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_type VARCHAR(50),
    allocated_principal NUMERIC(12,2),
    allocated_interest NUMERIC(12,2),
    allocated_fees NUMERIC(12,2),
    transaction_reference VARCHAR(100)
);

-- ================== NOTIFICATIONS ==================
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loanapplications(loan_id) ON DELETE CASCADE,
    channel VARCHAR(50),
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- ================== INDEXES ==================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_aadhaar ON users(aadhaar_no);
CREATE INDEX idx_users_pan ON users(pan_no);
CREATE INDEX idx_loans_user ON loanapplications(user_id);
CREATE INDEX idx_loans_product ON loanapplications(product_id);
CREATE INDEX idx_docs_loan ON documents(loan_id);
CREATE INDEX idx_repayments_loan ON repaymentschedule(loan_id);
CREATE INDEX idx_payments_loan ON payments(loan_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Optional: foreign key backfill note
-- If you want customerprofile.account_id to reference bank_accounts(account_id), you can add:
-- ALTER TABLE customerprofile
--   ADD CONSTRAINT fk_customer_account FOREIGN KEY (account_id) REFERENCES bank_accounts(account_id) ON DELETE SET NULL;
