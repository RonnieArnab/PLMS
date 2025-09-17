import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,

  // PostgreSQL
  dbUser: process.env.DB_USER || "postgres",
  dbHost: process.env.DB_HOST || "localhost",
  dbName: process.env.DB_NAME || "PLMS_DB",
  dbPass: process.env.DB_PASS || "123456",
  dbPort: Number(process.env.DB_PORT) || 5432,

  // JWT Secrets
  jwtSecret: process.env.JWT_SECRET || "super_secret_access_key",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "super_secret_refresh_key",

  // Cookie settings
  cookieSecure: process.env.COOKIE_SECURE === "true", // true in prod
  cookieSameSite: process.env.COOKIE_SAMESITE || "strict",

  // Razorpay
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_RIBPU0g2WXd7q9",
  razorpayKeySecret:
    process.env.RAZORPAY_KEY_SECRET || "uETJvymJFR6vY5onIUft0azB",
};
