import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { sendVerificationOtp } from "../../services/email.service.js";
import { ApiError } from "../../utils/api-error.js";
import { User } from "../users/user.model.js";
import { EmailVerification } from "./email-verification.model.js";
import { RequestThrottle } from "./request-throttle.model.js";
import { Session } from "./session.model.js";

const HASH_ROUNDS = 12;
const OTP_HASH_ROUNDS = 10;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const THROTTLE_WINDOW_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    roles: [...user.roles],
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input) {
  const existing = await User.findOne({ $or: [{ email: input.email }, { username: input.username }] }).select("email username status emailVerifiedAt").lean();
  if (existing) {
    if (existing.email === input.email && existing.status === "PENDING" && !existing.emailVerifiedAt) {
      throw new ApiError(409, "ACCOUNT_PENDING_VERIFICATION", "This account is waiting for email verification");
    }
    const field = existing.email === input.email ? "email" : "username";
    throw new ApiError(409, "ACCOUNT_ALREADY_EXISTS", `An account with this ${field} already exists`, { field });
  }

  const passwordHash = await bcrypt.hash(input.password, HASH_ROUNDS);
  try {
    return await User.create({
      firstName: input.firstName,
      lastName: input.lastName,
      username: input.username,
      email: input.email,
      passwordHash,
      roles: ["USER"],
      status: "PENDING",
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = error?.keyPattern?.email ? "email" : error?.keyPattern?.username ? "username" : null;
      throw new ApiError(
        409,
        "ACCOUNT_ALREADY_EXISTS",
        field ? `An account with this ${field} already exists` : "An account with this email or username already exists",
        field ? { field } : undefined,
      );
    }
    throw error;
  }
}

export async function verifyCredentials({ identifier, password }) {
  const normalized = identifier.trim().toLowerCase();
  const user = await User.findOne({ $or: [{ email: normalized }, { username: normalized }] }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "The email, username or password is incorrect");
  }
  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account has been suspended");
  }
  if (user.status === "PENDING" || !user.emailVerifiedAt) {
    throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Verify your email before signing in");
  }

  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

function throttleKey(scope, value, bucket) {
  return crypto.createHash("sha256").update(`${scope}:${value}:${bucket}`).digest("hex");
}

async function consumeThrottle({ scope, value, limit }) {
  const now = Date.now();
  const bucket = Math.floor(now / THROTTLE_WINDOW_MS);
  const key = throttleKey(scope, value, bucket);
  const expiresAt = new Date((bucket + 2) * THROTTLE_WINDOW_MS);
  const record = await RequestThrottle.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  if (record.count > limit) {
    throw new ApiError(429, "OTP_RATE_LIMITED", "Too many verification requests. Try again later");
  }
}

export async function sendUserVerificationOtp(user, ipAddress) {
  await Promise.all([
    consumeThrottle({ scope: "otp-email", value: user.email, limit: 5 }),
    consumeThrottle({ scope: "otp-ip", value: ipAddress || "unknown", limit: 20 }),
  ]);

  const now = new Date();
  const existing = await EmailVerification.findOne({ user: user._id }).lean();
  if (existing?.resendAvailableAt > now && !existing.consumedAt) {
    const retryAfterSeconds = Math.ceil((existing.resendAvailableAt.getTime() - now.getTime()) / 1000);
    throw new ApiError(429, "OTP_RESEND_COOLDOWN", `Wait ${retryAfterSeconds} seconds before requesting another code`, { retryAfterSeconds });
  }

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const otpHash = await bcrypt.hash(otp, OTP_HASH_ROUNDS);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

  const verification = await EmailVerification.findOneAndUpdate(
    { user: user._id },
    { $set: { otpHash, attempts: 0, expiresAt, resendAvailableAt, consumedAt: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  try {
    await sendVerificationOtp({ email: user.email, firstName: user.firstName, otp });
  } catch (error) {
    await EmailVerification.deleteOne({ _id: verification._id });
    console.error("Verification email delivery failed", { userId: user._id.toString(), error: error.message });
    throw new ApiError(503, "EMAIL_DELIVERY_FAILED", "We could not send the verification email. Please try again");
  }

  return { expiresInSeconds: OTP_TTL_MS / 1000, resendInSeconds: OTP_RESEND_COOLDOWN_MS / 1000 };
}

export async function verifyUserEmail({ email, otp }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "INVALID_OTP", "The verification code is invalid or expired");
  }
  if (user.emailVerifiedAt) {
    throw new ApiError(409, "EMAIL_ALREADY_VERIFIED", "This email address is already verified");
  }

  const verification = await EmailVerification.findOne({ user: user._id }).select("+otpHash");
  const now = new Date();
  if (!verification || verification.consumedAt || verification.expiresAt <= now) {
    throw new ApiError(400, "OTP_EXPIRED", "The verification code has expired. Request a new code");
  }
  if (verification.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "OTP_ATTEMPTS_EXCEEDED", "Too many incorrect attempts. Request a new code");
  }

  const matches = await bcrypt.compare(otp, verification.otpHash);
  if (!matches) {
    const updated = await EmailVerification.findOneAndUpdate(
      { _id: verification._id, consumedAt: null, attempts: { $lt: OTP_MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    const remainingAttempts = Math.max(OTP_MAX_ATTEMPTS - (updated?.attempts ?? OTP_MAX_ATTEMPTS), 0);
    throw new ApiError(400, "INVALID_OTP", "The verification code is incorrect", { remainingAttempts });
  }

  const consumed = await EmailVerification.findOneAndUpdate(
    { _id: verification._id, consumedAt: null, expiresAt: { $gt: now }, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $set: { consumedAt: now } },
    { new: true },
  );
  if (!consumed) {
    throw new ApiError(400, "OTP_EXPIRED", "The verification code is invalid or expired");
  }

  user.emailVerifiedAt = now;
  user.status = "ACTIVE";
  await user.save();
  return user;
}

export async function resendUserVerificationOtp(email, ipAddress) {
  const user = await User.findOne({ email });
  if (!user || user.emailVerifiedAt || user.status !== "PENDING") return null;
  return sendUserVerificationOtp(user, ipAddress);
}

export async function createSession(user, metadata = {}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    expiresAt,
  });
  return { token, session, expiresAt };
}

export async function getSessionUser(token) {
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: hashToken(token), revokedAt: null, expiresAt: { $gt: new Date() } }).populate("user");
  if (!session?.user || session.user.status === "SUSPENDED") return null;
  return { session, user: session.user };
}

export async function revokeSession(sessionId) {
  await Session.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllUserSessions(userId) {
  await Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}
