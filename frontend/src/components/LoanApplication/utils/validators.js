export const validateStep = (step, data, final = false) => {
  const errors = {};
  // STEP 1: Personal
  if (step === 1 || final) {
    if (!data.full_name?.trim()) errors.full_name = "Full name is required";
    if (!data.email?.trim()) errors.email = "Email is required";
    if (!data.phone?.trim() || !/^\d{10}$/.test(data.phone))
      errors.phone = "Enter 10-digit phone";
    if (!data.address?.trim()) errors.address = "Address is required";
    if (Object.keys(errors).length && !final) return { valid: false, errors };
  }
  // STEP 2: Loan Type
  if (step === 2 || final) {
    if (!data.product_id) errors.product_id = "Please choose a loan type";
    if (Object.keys(errors).length && !final) return { valid: false, errors };
  }
  // STEP 3: Compare (optional forward-only check — no hard errors)
  // (We don't block navigation; user can skip selection here if already chosen.)

  // STEP 4: Financial
  if (step === 4 || final) {
    if (!data.annual_income || Number(data.annual_income) <= 0)
      errors.annual_income = "Enter annual income";
    const amt = Number(data.loan_amount);
    const ten = Number(data.tenure_months);
    if (!amt || amt <= 0) errors.loan_amount = "Enter loan amount";
    if (!ten || ten <= 0) errors.tenure_months = "Enter tenure in months";
    if (!data.purpose?.trim()) errors.purpose = "Purpose is required";
    const p = data.product;
    if (p) {
      if (amt < p.min_amount || amt > p.max_amount)
        errors.loan_amount = `Amount must be ${p.min_amount}–${p.max_amount}`;
      if (ten < p.min_tenure || ten > p.max_tenure)
        errors.tenure_months = `Tenure must be ${p.min_tenure}–${p.max_tenure}`;
    }
    if (Object.keys(errors).length && !final) return { valid: false, errors };
  }
  // STEP 5: KYC — require both PAN and Aadhaar verified
  if (step === 5 || final) {
    if (!/^\d{12}$/.test(data.aadhaar_no || ""))
      errors.aadhaar_no = "Enter 12-digit Aadhaar";
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test((data.pan_no || "").toUpperCase()))
      errors.pan_no = "PAN must be ABCDE1234F";
    if (!data.pan_verified)
      errors.pan_no =
        (errors.pan_no ? errors.pan_no + "; " : "") + "PAN not verified";
    if (!data.aadhaar_verified)
      errors.aadhaar_no =
        (errors.aadhaar_no ? errors.aadhaar_no + "; " : "") +
        "Aadhaar not verified";
    if (Object.keys(errors).length && !final) return { valid: false, errors };
  }
  // STEP 6: Documents
  if (step === 6 || final) {
    if (!data.documents || data.documents.length === 0)
      errors.documents = "Please upload at least one document";
    if (Object.keys(errors).length && !final) return { valid: false, errors };
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
