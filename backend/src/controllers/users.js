export async function getAll(req, res) {
  res.json({ service: "users", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "users", action: "create", data: req.body });
}
