import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function verifyTrustedOrigin(request, _response, next) {
  if (safeMethods.has(request.method)) return next();

  const origin = request.get("origin");
  if (!origin || env.clientOrigins.includes(origin)) return next();

  return next(new ApiError(403, "UNTRUSTED_ORIGIN", "Requests from this origin are not allowed"));
}
