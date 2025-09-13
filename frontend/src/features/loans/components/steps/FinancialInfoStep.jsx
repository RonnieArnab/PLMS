// src/components/steps/FinancialInfoStep.jsx
import React from "react";
import { Input } from "@components/ui/Input";
import { Grid } from "@components/ui/Grid";

export default function FinancialInfoStep({ formData, setFormData, errors }) {
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="space-y-4">
      <Grid cols={2} className="gap-4">
        <Input
          name="profession"
          label="Profession / Employer"
          value={formData.profession}
          onChange={onChange}
          error={errors.profession}
        />
        <Input
          name="employer"
          label="Employer / Business"
          value={formData.employer}
          onChange={onChange}
        />
        <Input
          name="annual_income"
          type="number"
          label="Annual income (₹)"
          value={formData.annual_income}
          onChange={onChange}
          error={errors.annual_income}
        />
        <Input
          name="net_monthly_income"
          type="number"
          label="Net monthly income (₹)"
          value={formData.net_monthly_income}
          onChange={onChange}
        />
      </Grid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="loan_amount"
          type="number"
          label="Requested loan amount (₹)"
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
        label="Purpose / Notes"
        value={formData.purpose}
        onChange={onChange}
        error={errors.purpose}
      />
    </div>
  );
}
