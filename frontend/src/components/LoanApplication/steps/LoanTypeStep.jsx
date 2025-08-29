import React from "react";
import { inr } from "../utils/loanMaths";

// expects props: products[], formData {product_id, product}, setFormData, errors
export default function LoanTypeStep({
  products,
  formData,
  setFormData,
  errors,
}) {
  const select = (p) =>
    setFormData({ ...formData, product_id: p.product_id, product: p });
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Choose a loan type that matches your profession and needs. You can
        compare options in the next step.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <button
            key={p.product_id}
            onClick={() => select(p)}
            className={`text-left border rounded-xl p-4 hover:shadow transition ${
              formData.product_id === p.product_id
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-gray-200 dark:border-gray-700"
            }`}>
            <div className="font-semibold text-gray-900 dark:text-white">
              {p.name}
            </div>
            <div className="text-xs text-gray-500">
              For: {p.target_profession}
            </div>
            <div className="mt-2 text-sm">
              APR from <b>{p.base_interest_apr}%</b>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              ₹{inr(p.min_amount)}–₹{inr(p.max_amount)} · {p.min_tenure}–
              {p.max_tenure} mo
            </div>
            <div className="text-xs mt-1">
              Processing fee: {p.processing_fee_pct}%
            </div>
            <div className="text-xs">
              Prepayment: {p.prepayment_allowed ? "Allowed" : "Not allowed"}
            </div>
          </button>
        ))}
      </div>
      {errors.product_id && (
        <p className="text-sm text-red-600">{errors.product_id}</p>
      )}
    </div>
  );
}
