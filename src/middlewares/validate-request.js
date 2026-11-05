import { ApiError } from "../utils/api-error.js";

export function validateRequest(schema) {
  return function validationMiddleware(request, _response, next) {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return next(new ApiError(422, "VALIDATION_ERROR", "The request data is invalid", result.error.flatten().fieldErrors));
    }
    request.validatedBody = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return function queryValidationMiddleware(request, _response, next) {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      return next(new ApiError(422, "VALIDATION_ERROR", "The query parameters are invalid", result.error.flatten().fieldErrors));
    }
    request.validatedQuery = result.data;
    return next();
  };
}
