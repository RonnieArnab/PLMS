export const formatINR = (value) => {
  if (value == null || isNaN(value)) return "-";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }
};

export const formatINNumber = (value) => {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN").format(Number(value));
};
