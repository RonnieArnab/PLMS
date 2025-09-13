import React, { useState } from "react";

export default function CompareLoansStep({ products, formData, setFormData }) {
  const [selected, setSelected] = useState(
    () => new Set([formData.product_id].filter(Boolean))
  );
  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    if (s.size > 3) return; // limit to 3
    setSelected(s);
  };
  const chosen = products.filter((p) => selected.has(p.product_id));
  const choose = (p) =>
    setFormData({ ...formData, product_id: p.product_id, product: p });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Pick up to 3 to compare:
      </p>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <label
            key={p.product_id}
            className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
              selected.has(p.product_id)
                ? "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-700"
            }`}>
            <input
              type="checkbox"
              className="mr-2"
              checked={selected.has(p.product_id)}
              onChange={() => toggle(p.product_id)}
            />
            {p.name}
          </label>
        ))}
      </div>

      {chosen.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3">Product</th>
                <th className="text-left py-2 px-3">Target</th>
                <th className="text-left py-2 px-3">APR</th>
                <th className="text-left py-2 px-3">Amount Range</th>
                <th className="text-left py-2 px-3">Tenure</th>
                <th className="text-left py-2 px-3">Processing Fee</th>
                <th className="text-left py-2 px-3">Prepayment</th>
                <th className="text-left py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {chosen.map((p) => (
                <tr
                  key={p.product_id}
                  className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 px-3 font-medium">{p.name}</td>
                  <td className="py-2 px-3">{p.target_profession}</td>
                  <td className="py-2 px-3">{p.base_interest_apr}%</td>
                  <td className="py-2 px-3">
                    {p.min_amount}–{p.max_amount}
                  </td>
                  <td className="py-2 px-3">
                    {p.min_tenure}–{p.max_tenure} mo
                  </td>
                  <td className="py-2 px-3">{p.processing_fee_pct}%</td>
                  <td className="py-2 px-3">
                    {p.prepayment_allowed ? "Yes" : "No"}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      className={`px-3 py-1 rounded-md border ${
                        formData.product_id === p.product_id
                          ? "border-green-500 text-green-700"
                          : "border-gray-300"
                      }`}
                      onClick={() => choose(p)}>
                      {formData.product_id === p.product_id
                        ? "Selected"
                        : "Choose"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
