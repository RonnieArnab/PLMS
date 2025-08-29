export async function getAll(req, res) {
  res.json({ service: "loanApplications", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "loanApplications", action: "create", data: req.body });
}
