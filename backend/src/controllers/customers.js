export async function getAll(req, res) {
  res.json({ service: "customers", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "customers", action: "create", data: req.body });
}
