// Aadhaar KYC
export async function verifyAadhaar(req, res) {
  const { aadhaarNo } = req.body;
  // TODO: integrate with UIDAI offline XML/ZIP or mock validation
  res.json({
    service: "kyc",
    type: "aadhaar",
    status: "pending_verification",
    aadhaarNo,
  });
}

// PAN KYC
export async function verifyPan(req, res) {
  const { panNo } = req.body;
  // TODO: integrate with PAN validation API or mock
  res.json({
    service: "kyc",
    type: "pan",
    status: "pending_verification",
    panNo,
  });
}

// Document KYC
export async function verifyDocuments(req, res) {
  const { loanId, documentType, fileUrl } = req.body;
  // TODO: integrate with OCR / manual check
  res.json({
    service: "kyc",
    type: "document",
    loanId,
    documentType,
    status: "uploaded",
    fileUrl,
  });
}
