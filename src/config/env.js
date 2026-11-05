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
  supabase: Object.freeze({
    url: (process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, ""),
    serviceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
  }),
  cloudinary: Object.freeze({
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY ?? "").trim(),
    apiSecret: (process.env.CLOUDINARY_API_SECRET ?? "").trim(),
    folder: (process.env.CLOUDINARY_FOLDER ?? "the_cartel").trim().replace(/^\/+|\/+$/g, ""),
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

  const missingFeedSettings = [
    ["SUPABASE_URL", env.supabase.url],
    ["SUPABASE_SERVICE_ROLE_KEY", env.supabase.serviceRoleKey],
    ["CLOUDINARY_CLOUD_NAME", env.cloudinary.cloudName],
    ["CLOUDINARY_API_KEY", env.cloudinary.apiKey],
    ["CLOUDINARY_API_SECRET", env.cloudinary.apiSecret],
  ].filter(([, value]) => !value).map(([key]) => key);
  if (missingFeedSettings.length > 0) {
    throw new Error(`Missing feed service configuration: ${missingFeedSettings.join(", ")}`);
  }
}

export const isProduction = env.nodeEnv === "production";
