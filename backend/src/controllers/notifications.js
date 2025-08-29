export async function getAll(req, res) {
  res.json({ service: "notifications", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "notifications", action: "create", data: req.body });
}
