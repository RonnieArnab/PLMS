import React from "react";
import { Input } from "../../UI/Input";

export default function FinancialInfoStep({ formData, setFormData, errors }) {
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  return (
    <div className="space-y-4">
      <Input
        name="profession"
        label="Profession"
        value={formData.profession}
        onChange={onChange}
        error={errors.profession}
      />
      <Input
        name="annual_income"
        type="number"
        label="Annual Income (₹)"
        value={formData.annual_income}
        onChange={onChange}
        error={errors.annual_income}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="loan_amount"
          type="number"
          label="Loan Amount (₹)"
          value={formData.loan_amount}
          onChange={onChange}
          error={errors.loan_amount}
        />
        <Input
          name="tenure_months"
          type="number"
          label="Tenure (months)"
          value={formData.tenure_months}
          onChange={onChange}
          error={errors.tenure_months}
        />
      </div>
      <Input
        name="purpose"
        label="Purpose"
        value={formData.purpose}
        onChange={onChange}
        error={errors.purpose}
      />
    </div>
  );
}
