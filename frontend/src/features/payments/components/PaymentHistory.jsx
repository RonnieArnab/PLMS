import React from "react";
import { Button } from "@components/ui/Button.jsx";

export default function PaymentHistory({ loading, history, onDownload }) {
  const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);
  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-md bg-base-200/40 animate-pulse">
            <div className="h-6 w-40 bg-base-200" />
            <div className="h-6 w-24 bg-base-200" />
          </div>
        ))}
      </div>
    );

  if (!history || !history.length)
    return (
      <div className="text-center py-8 text-base-content/60">
        No payments found yet.
      </div>
    );

  return (
    <div className="space-y-3">
      {history.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between p-3 rounded-md bg-base-200/40">
          <div>
            <div className="font-semibold">
              {new Date(p.date).toLocaleDateString("en-IN")}
            </div>
            <div className="text-sm text-base-content/60">
              {p.method} • {p.ref}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-semibold">₹{inr(p.amount)}</div>
            <Button variant="ghost" size="sm" onClick={() => onDownload(p)}>
              Download
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
