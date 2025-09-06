// src/utils/loanMaths.js
export const inr = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN") : n;

export const calcEmi = (principal, aprPct, months) => {
  if (!principal || !aprPct || !months) return 0;
  const r = aprPct / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return Math.round((principal * r * pow) / (pow - 1));
};

export const calcProcessingFee = (amount = 0, pct = 0) =>
  Math.round((Number(amount) * Number(pct || 0)) / 100);
