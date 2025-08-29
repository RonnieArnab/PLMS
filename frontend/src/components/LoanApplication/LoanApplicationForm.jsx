import React, { useMemo, useState } from "react";
import { Card } from "../UI/Card";
import { Button } from "../UI/Button";
import {
  User,
  Layers,
  Columns,
  CreditCard,
  ShieldCheck,
  FileText,
  CheckCircle,
} from "lucide-react";
import { validateStep } from "./utils/validators";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import LoanTypeStep from "./steps/LoanTypeStep";
import CompareLoansStep from "./steps/CompareLoansStep";
import FinancialInfoStep from "./steps/FinancialInfoStep";
import KycVerificationStep from "./steps/KycVerificationStep";
import DocumentsStep from "./steps/DocumentsStep";
import ReviewSubmitStep from "./steps/ReviewSubmitStep";

export function LoanApplicationForm() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Step 1
    full_name: "",
    email: "",
    phone: "",
    address: "",
    // Step 2 (Loan Type)
    product_id: "",
    product: null,
    // Step 4 (Financial)
    annual_income: "",
    loan_amount: "",
    tenure_months: "",
    purpose: "",
    // Step 5 (KYC)
    pan_no: "",
    pan_verified: false,
    aadhaar_no: "",
    aadhaar_verified: false,
    kyc_otp: "",
    // Step 6 (Documents)
    documents: [],
  });

  // Mock products; replace with API later
  const products = useMemo(
    () => [
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
    ],
    []
  );

  const steps = [
    { id: 1, label: "Personal Info", icon: User },
    { id: 2, label: "Loan Type", icon: Layers },
    { id: 3, label: "Compare", icon: Columns },
    { id: 4, label: "Financial Info", icon: CreditCard },
    { id: 5, label: "KYC (PAN + Aadhaar)", icon: ShieldCheck },
    { id: 6, label: "Documents", icon: FileText },
    { id: 7, label: "Review & Submit", icon: CheckCircle },
  ];

  const next = () => {
    const { valid, errors: e } = validateStep(step, formData);
    setErrors(e);
    if (!valid) return;
    setStep((s) => Math.min(s + 1, steps.length));
  };
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    const { valid, errors: e } = validateStep(step, formData, true);
    setErrors(e);
    if (!valid) return;
    // Build final payload aligned with schema
    const payload = {
      applicant: {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      },
      loan: {
        product_id: formData.product_id,
        loan_amount: Number(formData.loan_amount),
        tenure_months: Number(formData.tenure_months),
        interest_rate_apr: formData.product?.base_interest_apr,
        processing_fee_pct: formData.product?.processing_fee_pct,
        purpose: formData.purpose,
      },
      kyc: {
        pan_no: formData.pan_no,
        pan_verified: formData.pan_verified,
        aadhaar_no: formData.aadhaar_no,
        aadhaar_verified: formData.aadhaar_verified,
      },
      documents: (formData.documents || []).map((f) => ({ name: f.name })),
    };
    console.log("Submitted Loan Application:", payload);
    alert("Loan Application Submitted Successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex justify-between items-center">
        {steps.map((s) => (
          <div
            key={s.id}
            className={`flex-1 flex flex-col items-center text-center px-2 ${
              step === s.id
                ? "text-blue-600"
                : step > s.id
                ? "text-green-600"
                : "text-gray-400"
            }`}>
            <s.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium text-center">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / steps.length) * 100}%` }}
        />
      </div>

      <Card className="p-6 space-y-6">
        {step === 1 && (
          <PersonalInfoStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {step === 2 && (
          <LoanTypeStep
            products={products}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {step === 3 && (
          <CompareLoansStep
            products={products}
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {step === 4 && (
          <FinancialInfoStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {step === 5 && (
          <KycVerificationStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {step === 6 && (
          <DocumentsStep
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
        )}
        {step === 7 && <ReviewSubmitStep formData={formData} />}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={back} disabled={step === 1}>
            Back
          </Button>
          {step < steps.length ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button onClick={handleSubmit}>Confirm & Submit</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
