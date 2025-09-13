import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@components/ui/Badge.jsx";
import { Button } from "@components/ui/Button.jsx";

export default function UpcomingPayments({ loading, upcoming, onDownload }) {
  const inr = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : n);
  if (loading)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-md bg-base-200/50 animate-pulse">
            <div className="h-6 w-40 bg-base-200" />
            <div className="h-6 w-20 bg-base-200" />
          </div>
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      {upcoming.map((payment, idx) => (
        <motion.div
          key={payment.id || idx}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.03 * idx }}
          className="flex items-center justify-between p-3 rounded-md bg-base-200/50">
          <div className="flex items-center gap-4">
            <Badge
              variant={payment.status === "due" ? "error" : "ghost"}
              size="sm">
              {payment.status}
            </Badge>
            <div>
              <div className="font-semibold">
                {new Date(payment.date).toLocaleDateString("en-IN")}
              </div>
              <div className="text-sm text-base-content/60">
                Monthly payment
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">₹{inr(payment.amount)}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(payment)}>
              Download
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
