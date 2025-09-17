import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,

  // PostgreSQL
  dbUser: process.env.DB_USER || "postgres",
  dbHost: process.env.DB_HOST || "localhost",
  dbName: process.env.DB_NAME || "PLMS_FSL",
  dbPass: process.env.DB_PASS || "101204",
  dbPort: Number(process.env.DB_PORT) || 5432,

  // JWT Secrets
  jwtSecret: process.env.JWT_SECRET || "super_secret_access_key",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "super_secret_refresh_key",

  // Cookie settings
  cookieSecure: process.env.COOKIE_SECURE === "true", // true in prod
  cookieSameSite: process.env.COOKIE_SAMESITE || "strict",
};
