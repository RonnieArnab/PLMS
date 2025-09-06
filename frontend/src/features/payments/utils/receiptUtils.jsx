import jsPDF from "jspdf";

export async function generatePdfFromHtmlElement(
  element,
  filename = "receipt.pdf"
) {
  const doc = new jsPDF({ unit: "px", format: "a4" });
  try {
    await doc.html(element, {
      x: 20,
      y: 20,
      html2canvas: { scale: 1.2, useCORS: true, backgroundColor: "#ffffff" },
      callback: () => doc.save(filename),
    });
  } catch (err) {
    console.error("generatePdfFromHtmlElement error:", err);
    throw err;
  }
}

export function buildReceiptHtml(payment) {
  return `
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
    <div style="width:56px;height:56px;border-radius:10px;background:linear-gradient(90deg,#84cc16,#22c55e);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">PL</div>
    <div>
      <div style="font-size:18px;font-weight:700;color:#0f172a;">PLMS Loans</div>
      <div style="font-size:12px;color:#6b7280;">Payment Receipt</div>
    </div>
  </div>
  <div style="height:1px;background:#e6e6e6;margin:12px 0;"></div>
  <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:12px;">
    <div>
      <div style="font-size:12px;color:#6b7280">PAYER</div>
      <div style="font-weight:600;color:#0f172a">${
        payment.payer?.name || "Customer"
      }</div>
      <div style="font-size:12px;color:#6b7280">${
        payment.payer?.email || ""
      }</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:12px;color:#6b7280">RECEIPT ID</div>
      <div style="font-weight:600;color:#0f172a">${payment.id}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:6px">DATE</div>
      <div style="font-weight:600;color:#0f172a">${payment.date}</div>
    </div>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:14px;color:#0f172a;">
    <thead>
      <tr><th style="text-align:left;padding:8px 0;border-bottom:1px solid #eee">Description</th><th style="text-align:right;padding:8px 0;border-bottom:1px solid #eee">Amount</th></tr>
    </thead>
    <tbody>
      <tr><td style="padding:10px 0">${
        payment.method || "Payment"
      }</td><td style="text-align:right;padding:10px 0">₹${
    typeof payment.amount === "number"
      ? payment.amount.toLocaleString("en-IN")
      : payment.amount
  }</td></tr>
    </tbody>
    <tfoot>
      <tr><td style="padding-top:12px;font-weight:700">Total</td><td style="padding-top:12px;text-align:right;font-weight:700">₹${
        typeof payment.amount === "number"
          ? payment.amount.toLocaleString("en-IN")
          : payment.amount
      }</td></tr>
    </tfoot>
  </table>
  <div style="margin-top:18px;font-size:12px;color:#6b7280">Reference: ${
    payment.ref || "-"
  }<br/>Thank you for your payment — if you have questions, contact support@example.com</div>
  `;
}

export async function downloadReceiptPdf(payment) {
  if (!payment) return;
  const container = document.createElement("div");
  container.style.all = "initial";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.padding = "24px";
  container.style.maxWidth = "760px";
  container.style.width = "760px";
  container.style.boxSizing = "border-box";
  container.style.fontFamily =
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  container.style.color = "#111827";
  container.style.backgroundColor = "#ffffff";
  container.style.lineHeight = "1.4";
  container.style.fontSize = "14px";
  container.innerHTML = buildReceiptHtml(payment);
  document.body.appendChild(container);
  try {
    await generatePdfFromHtmlElement(container, `receipt_${payment.id}.pdf`);
  } catch (err) {
    console.error("pdf error:", err);
    throw err;
  } finally {
    container.remove();
  }
}
