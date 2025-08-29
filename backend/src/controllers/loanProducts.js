export async function getAll(req, res) {
  res.json({ service: "loanProducts", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "loanProducts", action: "create", data: req.body });
}
