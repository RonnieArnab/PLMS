export async function getAll(req, res) {
  res.json({ service: "payments", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "payments", action: "create", data: req.body });
}
