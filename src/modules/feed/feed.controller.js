import { createFeedUploadSignature } from "../../services/cloudinary.service.js";
import { sendSuccess } from "../../utils/response.js";
import {
  createComment as createCommentRecord,
  createPost as createPostRecord,
  deleteComment as deleteCommentRecord,
  deletePost as deletePostRecord,
  getPost as getPostRecord,
  likePost as likePostRecord,
  listComments as listCommentRecords,
  listPosts as listPostRecords,
  searchTags as searchTagRecords,
  sharePost as sharePostRecord,
  unlikePost as unlikePostRecord,
  unsharePost as unsharePostRecord,
  updateComment as updateCommentRecord,
  updatePost as updatePostRecord,
} from "./feed.service.js";

export async function listPosts(request, response) {
  const result = await listPostRecords(request.validatedQuery, request.auth?.user?._id);
  return sendSuccess(response, { data: result });
}

export async function getPost(request, response) {
  const post = await getPostRecord(request.params.postId, request.auth?.user?._id);
  return sendSuccess(response, { data: { post } });
}

export async function createPost(request, response) {
  const post = await createPostRecord(request.auth.user._id, request.validatedBody);
  return sendSuccess(response, { statusCode: 201, message: "Post published", data: { post } });
}

export async function updatePost(request, response) {
  const post = await updatePostRecord(request.params.postId, request.auth.user._id, request.validatedBody);
  return sendSuccess(response, { message: "Post updated", data: { post } });
}

export async function deletePost(request, response) {
  const cleanup = await deletePostRecord(request.params.postId, request.auth.user._id);
  return sendSuccess(response, { message: "Post deleted", data: cleanup });
}

export async function createMediaSignature(request, response) {
  const upload = createFeedUploadSignature(request.auth.user._id.toString());
  return sendSuccess(response, { data: { upload } });
}

export async function likePost(request, response) {
  const result = await likePostRecord(request.params.postId, request.auth.user._id);
  return sendSuccess(response, { data: result });
}

export async function unlikePost(request, response) {
  const result = await unlikePostRecord(request.params.postId, request.auth.user._id);
  return sendSuccess(response, { data: result });
}

export async function listComments(request, response) {
  const result = await listCommentRecords(request.params.postId, request.validatedQuery);
  return sendSuccess(response, { data: result });
}

export async function createComment(request, response) {
  const comment = await createCommentRecord(request.params.postId, request.auth.user._id, request.validatedBody);
  return sendSuccess(response, { statusCode: 201, message: "Comment published", data: { comment } });
}

export async function updateComment(request, response) {
  const comment = await updateCommentRecord(request.params.commentId, request.auth.user._id, request.validatedBody);
  return sendSuccess(response, { message: "Comment updated", data: { comment } });
}

export async function deleteComment(request, response) {
  await deleteCommentRecord(request.params.commentId, request.auth.user._id);
  return sendSuccess(response, { message: "Comment deleted" });
}

export async function sharePost(request, response) {
  const result = await sharePostRecord(request.params.postId, request.auth.user._id);
  return sendSuccess(response, { data: result });
}

export async function unsharePost(request, response) {
  const result = await unsharePostRecord(request.params.postId, request.auth.user._id);
  return sendSuccess(response, { data: result });
}

export async function searchTags(request, response) {
  const tags = await searchTagRecords(request.validatedQuery);
  return sendSuccess(response, { data: { tags } });
}
