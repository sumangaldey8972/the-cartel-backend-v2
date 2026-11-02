import { z } from "zod";

const password = z.string().min(8, "Password must contain at least 8 characters").max(72, "Password cannot exceed 72 characters");
const username = z.string()
  .trim()
  .toLowerCase()
  .min(3, "Username must contain at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers and underscores");

export const signUpSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name cannot exceed 50 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name cannot exceed 50 characters"),
  username,
  email: z.email("Enter a valid email address").trim().toLowerCase().max(254, "Email address is too long"),
  password,
});

export const signInSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password,
});

export const verifyEmailSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const resendVerificationSchema = z.object({
  email: z.email().trim().toLowerCase().max(254),
});
