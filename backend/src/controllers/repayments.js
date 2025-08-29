export async function getAll(req, res) {
  res.json({ service: "repayments", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "repayments", action: "create", data: req.body });
}
