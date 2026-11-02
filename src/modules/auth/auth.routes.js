import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { getCurrentUser, resendVerification, signIn, signOut, signOutEverywhere, signUp, verifyEmail } from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import { resendVerificationSchema, signInSchema, signUpSchema, verifyEmailSchema } from "./auth.validation.js";

export const authRouter = Router();

authRouter.post("/sign-up", validateRequest(signUpSchema), asyncHandler(signUp));
authRouter.post("/verify-email", validateRequest(verifyEmailSchema), asyncHandler(verifyEmail));
authRouter.post("/resend-verification-otp", validateRequest(resendVerificationSchema), asyncHandler(resendVerification));
authRouter.post("/sign-in", validateRequest(signInSchema), asyncHandler(signIn));
authRouter.post("/sign-out", authenticate, asyncHandler(signOut));
authRouter.post("/sign-out-everywhere", authenticate, asyncHandler(signOutEverywhere));
authRouter.get("/me", authenticate, asyncHandler(getCurrentUser));
