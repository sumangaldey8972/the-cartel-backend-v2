export function sendSuccess(response, { statusCode = 200, data = null, message } = {}) {
  return response.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}
