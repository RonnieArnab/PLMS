import pkg from "pg";
import { env } from "./env.js";

const { Pool } = pkg;

const pool = new Pool({
  user: env.dbUser,
  host: env.dbHost,
  database: env.dbName,
  password: env.dbPass,
  port: env.dbPort,
  ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL:", env.dbName);
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error:", err.message);
  }
})();

export default pool;
