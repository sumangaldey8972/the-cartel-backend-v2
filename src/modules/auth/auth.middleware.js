import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { roleCodes } from "../roles/role.service.js";
import { getSessionUser } from "./auth.service.js";

export const authenticate = asyncHandler(async (request, _response, next) => {
  const result = await getSessionUser(request.cookies[env.sessionCookieName]);
  if (!result) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "You must sign in to continue");
  }
  request.auth = result;
  next();
});

export const optionalAuthenticate = asyncHandler(async (request, _response, next) => {
  const token = request.cookies[env.sessionCookieName];
  if (token) request.auth = await getSessionUser(token) ?? undefined;
  next();
});

export function authorizeRoles(...allowedRoles) {
  return function roleAuthorization(request, _response, next) {
    const userRoles = roleCodes(request.auth?.user?.roles);
    if (!allowedRoles.some((role) => userRoles.includes(role))) {
      return next(new ApiError(403, "INSUFFICIENT_PERMISSIONS", "You do not have permission to perform this action"));
    }
    return next();
  };
}
