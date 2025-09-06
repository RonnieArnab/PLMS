import pool from "../config/db.js";
export async function getAll(req, res) {
  const user = await pool.query("SELECT * FROM users");

  res.json({ service: "users", action: "getAll", user: user.rows });
}

export async function create(req, res) {
  res.json({ service: "users", action: "create", data: req.body });
}
