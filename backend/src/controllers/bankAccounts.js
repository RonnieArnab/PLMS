export async function getAll(req, res) {
  res.json({ service: "bankAccounts", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "bankAccounts", action: "create", data: req.body });
}
