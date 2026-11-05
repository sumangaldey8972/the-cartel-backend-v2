import { z } from "zod";
import { REPLY_PERMISSIONS } from "./feed.constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Enter a valid identifier");
const content = z.string().max(1_000, "Post content cannot exceed 1000 characters");
const media = z.object({
  publicId: z.string().trim().min(1).max(300),
  secureUrl: z.url().max(1_000),
  resourceType: z.enum(["image", "video"]),
  format: z.string().trim().max(30).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  altText: z.string().trim().max(1_000).default(""),
  taggedPeople: z.array(z.string().trim().min(1).max(30)).max(50).default([]),
  madeWithAi: z.boolean().default(false),
  cropAspect: z.enum(["original", "1 / 1", "16 / 9", "4 / 5"]).default("original"),
  cropX: z.number().min(0).max(100).default(50),
  cropY: z.number().min(0).max(100).default(50),
  zoom: z.number().min(1).max(2.5).default(1),
});

function containsContentOrMedia(value) {
  return Boolean(value.content?.trim() || value.media?.length);
}

export const createPostSchema = z.object({
  content: content.default(""),
  media: z.array(media).max(4, "A post can contain at most four media assets").default([]),
  replyPermission: z.enum(REPLY_PERMISSIONS).default("EVERYONE"),
}).refine(containsContentOrMedia, { message: "Write something or attach media", path: ["content"] });

export const updatePostSchema = z.object({
  content: content.optional(),
  media: z.array(media).max(4, "A post can contain at most four media assets").optional(),
  replyPermission: z.enum(REPLY_PERMISSIONS).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" });

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(1_000),
  parentCommentId: objectId.optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(1_000),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["latest", "oldest", "popular"]).default("latest"),
  tag: z.string().trim().max(80).optional(),
  author: objectId.optional(),
});

export const tagQuerySchema = z.object({
  query: z.string().trim().max(80).default(""),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
