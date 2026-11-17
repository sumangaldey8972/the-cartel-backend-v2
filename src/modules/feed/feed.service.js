import { ApiError } from "../../utils/api-error.js";
import { assertOwnedMedia, deleteCloudinaryAssets } from "../../services/cloudinary.service.js";
import { broadcastFeedEvent } from "../../services/realtime.service.js";
import { Comment } from "./comment.model.js";
import { CommentLike } from "./comment-like.model.js";
import { COMMENT_STATUS, POST_STATUS } from "./feed.constants.js";
import { Post } from "./post.model.js";
import { PostLike } from "./post-like.model.js";
import { PostShare } from "./post-share.model.js";
import { Tag } from "./tag.model.js";

const authorPopulate = { path: "author", select: "firstName lastName username" };

export function extractHashtags(content = "") {
  const matches = content.match(/#[\p{L}\p{M}\p{N}_]+/gu) ?? [];
  return matches
    .map((tag) => tag.toLocaleLowerCase())
    .filter((tag, index, values) => values.indexOf(tag) === index);
}

function sortFor(value) {
  if (value === "oldest") return { createdAt: 1 };
  if (value === "popular") return { likeCount: -1, commentCount: -1, createdAt: -1 };
  return { createdAt: -1 };
}

function normalizeTag(value) {
  if (!value) return null;
  const normalized = value.trim().toLocaleLowerCase();
  return normalized.startsWith("#") ? normalized : `#${normalized}`;
}

async function updateTagUsage(added = [], removed = []) {
  const now = new Date();
  const operations = [
    ...added.map((name) => ({
      updateOne: {
        filter: { name },
        update: { $inc: { usageCount: 1 }, $set: { lastUsedAt: now }, $setOnInsert: { name } },
        upsert: true,
      },
    })),
    ...removed.map((name) => ({
      updateOne: {
        filter: { name },
        update: [{ $set: { usageCount: { $max: [0, { $subtract: ["$usageCount", 1] }] } } }],
      },
    })),
  ];
  if (operations.length > 0) await Tag.bulkWrite(operations, { ordered: false });
}

async function safelyUpdateTagUsage(added = [], removed = []) {
  try {
    await updateTagUsage(added, removed);
  } catch (error) {
    console.warn("Feed tag usage update failed", { message: error.message });
  }
}

async function getPublishedPost(postId) {
  const post = await Post.findOne({ _id: postId, status: POST_STATUS.PUBLISHED });
  if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found");
  return post;
}

function assertAuthor(document, userId) {
  if (document.author.toString() !== userId.toString()) {
    throw new ApiError(403, "NOT_POST_AUTHOR", "Only the author can modify this content");
  }
}

async function addViewerState(posts, userId) {
  if (!userId || posts.length === 0) return posts.map((post) => ({ ...post, viewerHasLiked: false, viewerHasShared: false }));
  const postIds = posts.map((post) => post._id);
  const [likes, shares] = await Promise.all([
    PostLike.find({ post: { $in: postIds }, user: userId }).select("post").lean(),
    PostShare.find({ post: { $in: postIds }, user: userId }).select("post").lean(),
  ]);
  const likedIds = new Set(likes.map((record) => record.post.toString()));
  const sharedIds = new Set(shares.map((record) => record.post.toString()));
  return posts.map((post) => ({
    ...post,
    viewerHasLiked: likedIds.has(post._id.toString()),
    viewerHasShared: sharedIds.has(post._id.toString()),
  }));
}

export async function listPosts({ page, limit, sort, tag, author }, userId) {
  const query = { status: POST_STATUS.PUBLISHED };
  const normalizedTag = normalizeTag(tag);
  if (normalizedTag) query.tags = normalizedTag;
  if (author) query.author = author;
  const result = await Post.paginate(query, { page, limit, sort: sortFor(sort), populate: authorPopulate, lean: true });
  if (result.docs.length > 0) {
    const counts = await Comment.aggregate([
      { $match: { post: { $in: result.docs.map((post) => post._id) }, status: COMMENT_STATUS.PUBLISHED } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]);
    const countByPostId = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));
    result.docs = result.docs.map((post) => ({ ...post, commentCount: countByPostId.get(post._id.toString()) ?? 0 }));
  }
  result.docs = await addViewerState(result.docs, userId);
  return result;
}

export async function getPost(postId, userId) {
  const post = await Post.findOne({ _id: postId, status: POST_STATUS.PUBLISHED }).populate(authorPopulate).lean();
  if (!post) throw new ApiError(404, "POST_NOT_FOUND", "Post not found");
  return (await addViewerState([post], userId))[0];
}

export async function createPost(userId, input) {
  assertOwnedMedia(input.media, userId);
  const tags = extractHashtags(input.content);
  const post = await Post.create({ ...input, author: userId, content: input.content.trim(), tags });
  await Promise.all([
    safelyUpdateTagUsage(tags),
    post.populate(authorPopulate),
  ]);
  await broadcastFeedEvent("post.created", { post });
  return post;
}

export async function updatePost(postId, userId, input) {
  const post = await getPublishedPost(postId);
  assertAuthor(post, userId);
  const nextMedia = input.media ?? post.media;
  const nextContent = input.content === undefined ? post.content : input.content.trim();
  if (!nextContent && nextMedia.length === 0) {
    throw new ApiError(422, "EMPTY_POST", "Write something or attach media");
  }
  if (input.media) assertOwnedMedia(input.media, userId);

  const previousTags = [...post.tags];
  const nextTags = extractHashtags(nextContent);
  const removedMedia = input.media
    ? post.media.filter((current) => !input.media.some((next) => next.publicId === current.publicId))
    : [];
  post.content = nextContent;
  post.tags = nextTags;
  if (input.media) post.media = input.media;
  if (input.replyPermission) post.replyPermission = input.replyPermission;
  await post.save();

  await Promise.all([
    safelyUpdateTagUsage(
      nextTags.filter((tag) => !previousTags.includes(tag)),
      previousTags.filter((tag) => !nextTags.includes(tag)),
    ),
    removedMedia.length > 0 ? deleteCloudinaryAssets(removedMedia) : Promise.resolve(0),
    post.populate(authorPopulate),
  ]);
  await broadcastFeedEvent("post.updated", { post });
  return post;
}

export async function deletePost(postId, userId) {
  const post = await getPublishedPost(postId);
  assertAuthor(post, userId);
  post.status = POST_STATUS.DELETED;
  post.deletedAt = new Date();
  await post.save();

  const cleanupResults = await Promise.allSettled([
    PostLike.deleteMany({ post: post._id }),
    PostShare.deleteMany({ post: post._id }),
    Comment.updateMany({ post: post._id, status: COMMENT_STATUS.PUBLISHED }, { $set: { status: COMMENT_STATUS.DELETED, deletedAt: new Date() } }),
    deleteCloudinaryAssets(post.media),
    safelyUpdateTagUsage([], post.tags),
  ]);
  cleanupResults.forEach((result, index) => {
    if (result.status === "rejected") console.warn("Post cleanup step failed", { postId: post._id.toString(), step: index, message: result.reason?.message });
  });
  const mediaResult = cleanupResults[3];
  const mediaCleanupFailures = mediaResult.status === "fulfilled" ? mediaResult.value : post.media.length;
  await broadcastFeedEvent("post.deleted", { postId: post._id.toString() });
  return { mediaCleanupFailures };
}

export async function likePost(postId, userId) {
  await getPublishedPost(postId);
  let created = false;
  try {
    await PostLike.create({ post: postId, user: userId });
    created = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  if (created) await Post.updateOne({ _id: postId }, { $inc: { likeCount: 1 } });
  const post = await Post.findById(postId).select("likeCount").lean();
  if (created) await broadcastFeedEvent("post.liked", { postId, userId: userId.toString(), likeCount: post.likeCount });
  return { liked: true, likeCount: post.likeCount };
}

export async function unlikePost(postId, userId) {
  const result = await PostLike.deleteOne({ post: postId, user: userId });
  if (result.deletedCount > 0) {
    await Post.updateOne({ _id: postId, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
  }
  const post = await getPublishedPost(postId);
  if (result.deletedCount > 0) await broadcastFeedEvent("post.unliked", { postId, userId: userId.toString(), likeCount: post.likeCount });
  return { liked: false, likeCount: post.likeCount };
}

export async function listComments(postId, { page, limit, sort }, userId) {
  await getPublishedPost(postId);
  const result = await Comment.paginate(
    { post: postId, status: COMMENT_STATUS.PUBLISHED },
    { page, limit, sort: sortFor(sort), populate: authorPopulate, lean: true },
  );
  if (!userId || result.docs.length === 0) {
    result.docs = result.docs.map((comment) => ({ ...comment, likeCount: comment.likeCount ?? 0, viewerHasLiked: false }));
    return result;
  }
  const likes = await CommentLike.find({ comment: { $in: result.docs.map((comment) => comment._id) }, user: userId }).select("comment").lean();
  const likedIds = new Set(likes.map((like) => like.comment.toString()));
  result.docs = result.docs.map((comment) => ({ ...comment, likeCount: comment.likeCount ?? 0, viewerHasLiked: likedIds.has(comment._id.toString()) }));
  return result;
}

export async function createComment(postId, userId, input) {
  await getPublishedPost(postId);
  if (input.parentCommentId) {
    const parent = await Comment.findOne({ _id: input.parentCommentId, post: postId, status: COMMENT_STATUS.PUBLISHED }).lean();
    if (!parent) throw new ApiError(404, "PARENT_COMMENT_NOT_FOUND", "Parent comment not found");
  }
  const comment = await Comment.create({
    post: postId,
    author: userId,
    parentComment: input.parentCommentId ?? null,
    content: input.content,
  });
  await Promise.all([
    Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } }),
    comment.populate(authorPopulate),
  ]);
  const post = await Post.findById(postId).select("commentCount").lean();
  await broadcastFeedEvent("comment.created", { postId, comment, commentCount: post?.commentCount ?? 0 });
  return comment;
}

export async function updateComment(commentId, userId, input) {
  const comment = await Comment.findOne({ _id: commentId, status: COMMENT_STATUS.PUBLISHED });
  if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found");
  assertAuthor(comment, userId);
  comment.content = input.content;
  await comment.save();
  await comment.populate(authorPopulate);
  await broadcastFeedEvent("comment.updated", { postId: comment.post.toString(), comment });
  return comment;
}

export async function deleteComment(commentId, userId) {
  const comment = await Comment.findOne({ _id: commentId, status: COMMENT_STATUS.PUBLISHED });
  if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found");
  assertAuthor(comment, userId);
  comment.status = COMMENT_STATUS.DELETED;
  comment.deletedAt = new Date();
  await comment.save();
  await Post.updateOne({ _id: comment.post, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
  const post = await Post.findById(comment.post).select("commentCount").lean();
  await broadcastFeedEvent("comment.deleted", { postId: comment.post.toString(), commentId: comment._id.toString(), commentCount: post?.commentCount ?? 0 });
}

export async function likeComment(commentId, userId) {
  const comment = await Comment.findOne({ _id: commentId, status: COMMENT_STATUS.PUBLISHED }).select("post likeCount");
  if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found");
  let created = false;
  try {
    await CommentLike.create({ comment: commentId, user: userId });
    created = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  if (created) await Comment.updateOne({ _id: commentId }, { $inc: { likeCount: 1 } });
  const updated = await Comment.findById(commentId).select("post likeCount").lean();
  if (created) await broadcastFeedEvent("comment.liked", { postId: updated.post.toString(), commentId, userId: userId.toString(), likeCount: updated.likeCount });
  return { liked: true, likeCount: updated.likeCount };
}

export async function unlikeComment(commentId, userId) {
  const result = await CommentLike.deleteOne({ comment: commentId, user: userId });
  const comment = await Comment.findOne({ _id: commentId, status: COMMENT_STATUS.PUBLISHED }).select("post likeCount");
  if (!comment) throw new ApiError(404, "COMMENT_NOT_FOUND", "Comment not found");
  if (result.deletedCount > 0) await Comment.updateOne({ _id: commentId, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
  const updated = await Comment.findById(commentId).select("post likeCount").lean();
  if (result.deletedCount > 0) await broadcastFeedEvent("comment.unliked", { postId: updated.post.toString(), commentId, userId: userId.toString(), likeCount: updated.likeCount });
  return { liked: false, likeCount: updated.likeCount };
}

export async function sharePost(postId, userId) {
  await getPublishedPost(postId);
  let created = false;
  try {
    await PostShare.create({ post: postId, user: userId });
    created = true;
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  if (created) await Post.updateOne({ _id: postId }, { $inc: { shareCount: 1 } });
  const post = await Post.findById(postId).select("shareCount").lean();
  if (created) await broadcastFeedEvent("post.shared", { postId, userId: userId.toString(), shareCount: post.shareCount });
  return { shared: true, shareCount: post.shareCount };
}

export async function unsharePost(postId, userId) {
  const result = await PostShare.deleteOne({ post: postId, user: userId });
  if (result.deletedCount > 0) {
    await Post.updateOne({ _id: postId, shareCount: { $gt: 0 } }, { $inc: { shareCount: -1 } });
  }
  const post = await getPublishedPost(postId);
  if (result.deletedCount > 0) await broadcastFeedEvent("post.unshared", { postId, userId: userId.toString(), shareCount: post.shareCount });
  return { shared: false, shareCount: post.shareCount };
}

export async function searchTags({ query, limit }) {
  const filter = query ? { name: { $regex: `^${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/^#/, "#?")}`, $options: "i" } } : {};
  return Tag.find(filter).sort({ usageCount: -1, lastUsedAt: -1 }).limit(limit).lean();
}
