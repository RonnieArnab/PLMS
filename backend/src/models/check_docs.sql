-- dump_user_full_kyc_loans.sql
-- Usage:
--   psql -v email='user@example.com' -f dump_user_full_kyc_loans.sql
-- OR
--   psql -v user_id='6f1b3b8a-...' -f dump_user_full_kyc_loans.sql
-- Ensure your PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD env vars are set or provide connection flags to psql.

\set ON_ERROR_STOP on
\set ECHO_HIDDEN off

\echo
\echo "======================================"
\echo "USER KYC + LOANS FULL REPORT"
\echo "======================================"

-- If email is provided, resolve and set user_id variable
-- (psql will set the variable user_id via \gset)
-- If email is not provided, user_id must be passed with -v user_id=...
\if :{?email}
  \echo "Resolving user_id for email: :email"
  SELECT user_id::text AS user_id
  FROM users
  WHERE email = :'email'
  LIMIT 1
  \gset
  \if :{?user_id}
    \echo "Found user_id = :user_id"
  \else
    \echo "No user found for email :email"
    \q 2
  \endif
\else
  \if ! :{?user_id}
    \echo "Error: either -v email='...' or -v user_id='...' must be provided"
    \q 2
  \endif
\endif

\echo
\echo "--------------------"
\echo "USER"
\echo "--------------------"
SELECT row_to_json(u.*) AS user
FROM (
  SELECT user_id::text, email, role, phone_number, created_at, updated_at
  FROM users
  WHERE user_id = :'user_id'
) u;

\echo
\echo "--------------------"
\echo "CUSTOMER PROFILE (if any)"
\echo "--------------------"
SELECT row_to_json(cp.*) AS customer_profile
FROM (
  SELECT customer_id::text, user_id::text, full_name, aadhaar_no, pan_no, profession, years_experience, annual_income, kyc_status, latest_kyc_id::text, address, account_id::text, created_at
  FROM customerprofile
  WHERE user_id = :'user_id'
) cp;

\echo
\echo "--------------------"
\echo "BANK ACCOUNTS (customer)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(ba)), '[]') AS bank_accounts
FROM (
  SELECT account_id::text, customer_id::text, bank_name, branch_name, ifsc_code, account_number, account_type, is_primary, created_at
  FROM bank_accounts
  WHERE customer_id = (SELECT customer_id FROM customerprofile WHERE user_id = :'user_id')
  ORDER BY created_at DESC
) ba;

\echo
\echo "--------------------"
\echo "LOAN APPLICATIONS"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(la)), '[]') AS loan_applications
FROM (
  SELECT loan_id::text, user_id::text, product_id::text, loan_amount, tenure_months, application_status, approved_amount, interest_rate_apr, processing_fee, risk_grade, applied_date, approved_date, disbursement_date, created_at
  FROM loanapplications
  WHERE user_id = :'user_id'
  ORDER BY created_at DESC
) la;

\echo
\echo "--------------------"
\echo "DOCUMENTS (uploaded by user)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(doc)), '[]') AS documents
FROM (
  SELECT document_id::text, loan_id::text, uploaded_by_user::text, document_type, file_url, verification_status, uploaded_at
  FROM documents
  WHERE uploaded_by_user = :'user_id'
  ORDER BY uploaded_at DESC
) doc;

\echo
\echo "--------------------"
\echo "REPAYMENT SCHEDULE (loans)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(rs)), '[]') AS repayments
FROM (
  SELECT r.repayment_id::text, r.loan_id::text, r.installment_no, r.due_date, r.principal_due, r.interest_due, r.total_due, r.status
  FROM repaymentschedule r
  JOIN loanapplications l ON l.loan_id = r.loan_id
  WHERE l.user_id = :'user_id'
  ORDER BY r.due_date
) rs;

\echo
\echo "--------------------"
\echo "PAYMENTS (loans)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(p)), '[]') AS payments
FROM (
  SELECT payment_id::text, repayment_id::text, loan_id::text, payer_user_id::text, payment_date, amount_paid, payment_method, payment_type, allocated_principal, allocated_interest, allocated_fees, transaction_reference, created_at
  FROM payments
  WHERE payer_user_id = :'user_id'
  ORDER BY payment_date DESC
) p;

\echo
\echo "--------------------"
\echo "NOTIFICATIONS"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(n)), '[]') AS notifications
FROM (
  SELECT notification_id::text, user_id::text, loan_id::text, channel, message, sent_at
  FROM notifications
  WHERE user_id = :'user_id'
  ORDER BY sent_at DESC
) n;

\echo
\echo "--------------------"
\echo "KYC FILES (uploads by user)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(f)), '[]') AS kyc_files
FROM (
  SELECT id::text, user_id::text, customer_id::text, type, original_filename, stored_filename, file_path, mime, size_bytes, created_at
  FROM kyc_files
  WHERE user_id = :'user_id'
  ORDER BY created_at DESC
) f;

\echo
\echo "--------------------"
\echo "KYC RECORDS (all)"
\echo "--------------------"
SELECT coalesce(json_agg(row_to_json(r)), '[]') AS kyc_records
FROM (
  SELECT r.id::text,
         r.user_id::text,
         r.customer_id::text,
         r.kyc_type,
         r.source,
         r.file_id::text,
         r.xml_file_id::text,
         r.parsed_json,
         r.confidence_score,
         r.status,
         r.reviewer_id::text,
         r.notes,
         r.created_at
  FROM kyc_records r
  WHERE r.user_id = :'user_id'
  ORDER BY r.created_at DESC
) r;

\echo
\echo "--------------------"
\echo "LATEST KYC PER TYPE (convenience)"
\echo "--------------------"
WITH latest AS (
  SELECT DISTINCT ON (kyc_type) id, kyc_type, status, created_at, parsed_json, confidence_score, file_id, xml_file_id
  FROM kyc_records
  WHERE user_id = :'user_id'
  ORDER BY kyc_type, created_at DESC
)
SELECT coalesce(json_object_agg(kyc_type, row_to_json(t)), '{}'::json) AS latest_by_type
FROM (
  SELECT kyc_type, id::text, status, created_at, parsed_json, confidence_score, file_id::text, xml_file_id::text
  FROM latest
) t;

\echo
\echo "======================================"
\echo "END OF REPORT"
\echo "======================================"
