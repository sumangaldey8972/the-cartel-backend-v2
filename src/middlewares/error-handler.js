import mongoose from "mongoose";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";

export function notFoundHandler(request, _response, next) {
  next(new ApiError(404, "ROUTE_NOT_FOUND", `Route not found: ${request.method} ${request.originalUrl}`));
}

export function errorHandler(error, _request, response, _next) {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
    });
  }

  if (error instanceof ZodError) {
    return response.status(422).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "The request data is invalid", details: error.flatten().fieldErrors },
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return response.status(400).json({ success: false, error: { code: "INVALID_IDENTIFIER", message: "The supplied identifier is invalid" } });
  }

  console.error("Unhandled API error", error);
  return response.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" } });
}
