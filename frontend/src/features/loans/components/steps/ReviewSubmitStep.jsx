// src/components/steps/ReviewSubmitStep.jsx
import React from "react";
import { Card } from "@components/ui/Card";
import { inr, calcEmi, calcProcessingFee } from "../../utils/loanMaths";
import { Text } from "@components/ui/Text";

export default function ReviewSubmitStep({ formData }) {
  const p = formData.product;
  const amount = Number(formData.loan_amount || 0);
  const apr = p?.base_interest_apr || 0;
  const tenure = Number(formData.tenure_months || 0);
  const emi = calcEmi(amount, apr, tenure);
  const fee = calcProcessingFee(amount, p?.processing_fee_pct || 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h4 className="font-semibold mb-2">Applicant</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            Full Name: <b>{formData.full_name}</b>
          </div>
          <div>
            Email: <b>{formData.email}</b>
          </div>
          <div>
            Phone: <b>{formData.phone}</b>
          </div>
          <div>
            DOB: <b>{formData.dob || "-"}</b>
          </div>
          <div>
            Address: <b>{formData.address}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Bank for Disbursal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            Bank: <b>{formData.bank_name || "-"}</b>
          </div>
          <div>
            Account:{" "}
            <b>
              {formData.account_number
                ? "•••" + formData.account_number.slice(-4)
                : "-"}
            </b>
          </div>
          <div>
            IFSC: <b>{formData.ifsc || "-"}</b>
          </div>
          <div>
            Holder: <b>{formData.account_holder || "-"}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Loan</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            Product: <b>{p?.name}</b>
          </div>
          <div>
            Loan Amount: <b>₹{inr(amount)}</b>
          </div>
          <div>
            Tenure: <b>{tenure} months</b>
          </div>
          <div>
            APR: <b>{apr}%</b>
          </div>
          <div>
            Processing Fee: <b>₹{inr(fee)}</b>
          </div>
          <div>
            Estimated EMI: <b>₹{inr(emi)}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Documents</h4>
        <ul className="list-disc ml-5">
          {(formData.documents || []).map((d, i) => (
            <li key={i}>{d.name}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
