import { env, isProduction } from "../../config/env.js";
import { sendSuccess } from "../../utils/response.js";
import {
  createSession,
  publicUser,
  registerUser,
  resendUserVerificationOtp,
  revokeAllUserSessions,
  revokeSession,
  sendUserVerificationOtp,
  verifyUserEmail,
  verifyCredentials,
} from "./auth.service.js";

function cookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  };
}

function requestMetadata(request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent")?.slice(0, 500),
  };
}

export async function signUp(request, response) {
  const user = await registerUser(request.validatedBody);
  const verification = await sendUserVerificationOtp(user, request.ip);
  return sendSuccess(response, {
    statusCode: 201,
    message: "Verification code sent",
    data: { user: publicUser(user), verification },
  });
}

export async function verifyEmail(request, response) {
  const user = await verifyUserEmail(request.validatedBody);
  const { token, expiresAt } = await createSession(user, requestMetadata(request));
  response.cookie(env.sessionCookieName, token, cookieOptions(expiresAt));
  return sendSuccess(response, { message: "Email verified", data: { user: publicUser(user) } });
}

export async function resendVerification(request, response) {
  const verification = await resendUserVerificationOtp(request.validatedBody.email, request.ip);
  return sendSuccess(response, {
    message: "If an unverified account exists, a new code has been sent",
    data: verification ? { verification } : null,
  });
}

export async function signIn(request, response) {
  const user = await verifyCredentials(request.validatedBody);
  const { token, expiresAt } = await createSession(user, requestMetadata(request));
  response.cookie(env.sessionCookieName, token, cookieOptions(expiresAt));
  return sendSuccess(response, { message: "Signed in", data: { user: publicUser(user) } });
}

export async function signOut(request, response) {
  await revokeSession(request.auth.session._id);
  response.clearCookie(env.sessionCookieName, cookieOptions(new Date(0)));
  return sendSuccess(response, { message: "Signed out" });
}

export async function signOutEverywhere(request, response) {
  await revokeAllUserSessions(request.auth.user._id);
  response.clearCookie(env.sessionCookieName, cookieOptions(new Date(0)));
  return sendSuccess(response, { message: "Signed out from every session" });
}

export async function getCurrentUser(request, response) {
  return sendSuccess(response, { data: { user: publicUser(request.auth.user) } });
}
