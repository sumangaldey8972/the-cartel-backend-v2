import "dotenv/config";

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins(value) {
  return (value ?? "http://127.0.0.1:4180,http://localhost:4180")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePositiveInteger(process.env.PORT, 4000),
  mongoUrl: process.env.MONGO_URL ?? "",
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "cartel_session",
  sessionTtlDays: parsePositiveInteger(process.env.SESSION_TTL_DAYS, 7),
  smtp: Object.freeze({
    host: process.env.SMTP_HOST ?? "",
    port: parsePositiveInteger(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.EMAIL_FROM ?? "",
  }),
});

export function assertServerEnvironment() {
  if (!env.mongoUrl) {
    throw new Error("MONGO_URL is required");
  }

  const missingEmailSettings = Object.entries(env.smtp)
    .filter(([key, value]) => key !== "port" && !value)
    .map(([key]) => key);
  if (missingEmailSettings.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingEmailSettings.join(", ")}`);
  }
}

export const isProduction = env.nodeEnv === "production";
