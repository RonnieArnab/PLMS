// src/components/steps/LoanTypeStep.jsx
import React from "react";
import { inr } from "../../utils/loanMaths";
import { Text } from "@components/ui/Text";

export default function LoanTypeStep({
  products = [],
  formData,
  setFormData,
  errors,
}) {
  const select = (p) =>
    setFormData({ ...formData, product_id: p.product_id, product: p });

  return (
    <div className="space-y-4">
      <Text size="sm" className="text-base-content/70">
        Choose a loan type that matches your profession and needs. Tap a card to
        select.
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <button
            key={p.product_id}
            onClick={() => select(p)}
            className={`text-left border rounded-xl p-4 hover:shadow transition ${
              formData.product_id === p.product_id
                ? "border-lime-500 ring-2 ring-lime-500/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
            aria-pressed={formData.product_id === p.product_id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {p.name}
                </div>
                <div className="text-xs text-gray-500">
                  For: {p.target_profession}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">APR</div>
                <div className="font-semibold">{p.base_interest_apr}%</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
              {p.min_tenure}–{p.max_tenure} mo • ₹{inr(p.min_amount)}–₹
              {inr(p.max_amount)}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <div>Processing fee: {p.processing_fee_pct}%</div>
              <div>
                {p.prepayment_allowed ? "Prepayment allowed" : "No prepay"}
              </div>
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
