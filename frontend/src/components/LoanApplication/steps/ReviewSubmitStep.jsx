import React from "react";
import { Card } from "../../UI/Card";
import { inr, calcEmi, calcProcessingFee } from "../utils/loanMaths";

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
        <h4 className="font-semibold mb-2">Applicant Details</h4>
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
            Address: <b>{formData.address}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Loan Selection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            Product: <b>{p?.name}</b>
          </div>
          <div>
            Target Profession: <b>{p?.target_profession}</b>
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
          <div>
            Purpose: <b>{formData.purpose}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">KYC</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            PAN: <b>{formData.pan_no || "-"}</b> • Status:{" "}
            <b>{formData.pan_verified ? "verified" : "not verified"}</b>
          </div>
          <div>
            Aadhaar: <b>{formData.aadhaar_no || "-"}</b> • Status:{" "}
            <b>{formData.aadhaar_verified ? "verified" : "not verified"}</b>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold mb-2">Documents</h4>
        <ul className="list-disc ml-5 text-sm">
          {(formData.documents || []).map((f, i) => (
            <li key={i}>{f.name || "file"}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
