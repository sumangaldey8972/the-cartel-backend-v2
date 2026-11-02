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
