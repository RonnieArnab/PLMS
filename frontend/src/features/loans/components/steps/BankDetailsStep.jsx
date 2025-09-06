// src/components/steps/BankDetailsStep.jsx
import React from "react";
import { Input } from "@components/ui/Input";
import { Card } from "@components/ui/Card";
import { Text } from "@components/ui/Text";

export default function BankDetailsStep({ formData, setFormData, errors }) {
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-2">Bank details (used for disbursal)</h4>
      <Text size="sm" className="mb-3 text-base-content/60">
        Provide a bank account to which approved funds should be disbursed.
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          name="bank_name"
          label="Bank name"
          value={formData.bank_name || ""}
          onChange={onChange}
          error={errors.bank_name}
        />
        <Input
          name="account_number"
          label="Account number"
          value={formData.account_number || ""}
          onChange={onChange}
          error={errors.account_number}
        />
        <Input
          name="ifsc"
          label="IFSC code"
          value={formData.ifsc || ""}
          onChange={onChange}
          error={errors.ifsc}
        />
        <Input
          name="account_holder"
          label="Account holder name"
          value={formData.account_holder || ""}
          onChange={onChange}
          error={errors.account_holder}
        />
      </div>
    </Card>
  );
}
