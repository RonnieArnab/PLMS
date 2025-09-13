export async function getAll(req, res) {
  res.json({ service: "documents", action: "getAll" });
}

export async function create(req, res) {
  res.json({ service: "documents", action: "create", data: req.body });
}
