import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../auth/auth.middleware.js";
import { validateQuery, validateRequest } from "../../middlewares/validate-request.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createComment,
  createMediaSignature,
  createPost,
  deleteComment,
  deletePost,
  getPost,
  likePost,
  listComments,
  listPosts,
  searchTags,
  sharePost,
  unlikePost,
  unsharePost,
  updateComment,
  updatePost,
} from "./feed.controller.js";
import {
  createCommentSchema,
  createPostSchema,
  paginationQuerySchema,
  tagQuerySchema,
  updateCommentSchema,
  updatePostSchema,
} from "./feed.validation.js";

export const feedRouter = Router();

feedRouter.get("/posts", optionalAuthenticate, validateQuery(paginationQuerySchema), asyncHandler(listPosts));
feedRouter.get("/posts/:postId", optionalAuthenticate, asyncHandler(getPost));
feedRouter.post("/posts", authenticate, validateRequest(createPostSchema), asyncHandler(createPost));
feedRouter.patch("/posts/:postId", authenticate, validateRequest(updatePostSchema), asyncHandler(updatePost));
feedRouter.delete("/posts/:postId", authenticate, asyncHandler(deletePost));

feedRouter.post("/media/signature", authenticate, asyncHandler(createMediaSignature));

feedRouter.post("/posts/:postId/likes", authenticate, asyncHandler(likePost));
feedRouter.delete("/posts/:postId/likes", authenticate, asyncHandler(unlikePost));

feedRouter.get("/posts/:postId/comments", validateQuery(paginationQuerySchema), asyncHandler(listComments));
feedRouter.post("/posts/:postId/comments", authenticate, validateRequest(createCommentSchema), asyncHandler(createComment));
feedRouter.patch("/comments/:commentId", authenticate, validateRequest(updateCommentSchema), asyncHandler(updateComment));
feedRouter.delete("/comments/:commentId", authenticate, asyncHandler(deleteComment));

feedRouter.post("/posts/:postId/shares", authenticate, asyncHandler(sharePost));
feedRouter.delete("/posts/:postId/shares", authenticate, asyncHandler(unsharePost));

feedRouter.get("/tags", validateQuery(tagQuerySchema), asyncHandler(searchTags));
