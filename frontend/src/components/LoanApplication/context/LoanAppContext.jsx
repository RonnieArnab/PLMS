import React, { createContext, useContext, useMemo, useState } from "react";

const LoanAppCtx = createContext(null);
export const useLoanApp = () => {
  const ctx = useContext(LoanAppCtx);
  if (!ctx) throw new Error("useLoanApp must be used within LoanAppProvider");
  return ctx;
};

const PRODUCTS = [
  {
    product_id: 1,
    name: "Pro Equipment",
    target_profession: "Doctor",
    min_amount: 100000,
    max_amount: 3000000,
    min_tenure: 6,
    max_tenure: 84,
    base_interest_apr: 12.5,
    processing_fee_pct: 1.5,
    prepayment_allowed: true,
  },
  {
    product_id: 2,
    name: "Office Setup",
    target_profession: "Lawyer",
    min_amount: 50000,
    max_amount: 2000000,
    min_tenure: 6,
    max_tenure: 60,
    base_interest_apr: 13.0,
    processing_fee_pct: 2.0,
    prepayment_allowed: true,
  },
  {
    product_id: 3,
    name: "Working Capital",
    target_profession: "Engineer",
    min_amount: 50000,
    max_amount: 1500000,
    min_tenure: 3,
    max_tenure: 48,
    base_interest_apr: 14.25,
    processing_fee_pct: 2.25,
    prepayment_allowed: false,
  },
];

export function LoanAppProvider({ children }) {
  const [values, setValues] = useState({
    product_id: "",
    product: null,
    loan_amount: "",
    tenure_months: "",
    monthly_income: "",
    years_experience: "",
    existing_emis: "",
    address: "",
    pan_no: "",
    aadhaar_no: "",
    kyc_pan_status: "pending",
    kyc_aadhaar_status: "pending",
    kyc_otp: "",
  });
  const [files, setFiles] = useState([]); // [{document_type, file}]
  const products = useMemo(() => PRODUCTS, []);

  const setField = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const bindField = (e) => setField(e.target.name, e.target.value);

  const addFile = (file) =>
    file && setFiles((arr) => [...arr, { document_type: "AADHAAR", file }]);
  const setLastDocType = (type) =>
    setFiles((arr) =>
      arr.length
        ? [...arr.slice(0, -1), { ...arr.at(-1), document_type: type }]
        : arr
    );
  const removeFile = (i) =>
    setFiles((arr) => arr.filter((_, idx) => idx !== i));

  return (
    <LoanAppCtx.Provider
      value={{
        values,
        setValues,
        setField,
        bindField,
        files,
        setFiles,
        addFile,
        setLastDocType,
        removeFile,
        products,
      }}>
      {children}
    </LoanAppCtx.Provider>
  );
}
