import { connectDatabase } from "../config/database.js";
import { asyncHandler } from "../utils/async-handler.js";

export const ensureDatabase = asyncHandler(async (_request, _response, next) => {
  await connectDatabase();
  next();
});
