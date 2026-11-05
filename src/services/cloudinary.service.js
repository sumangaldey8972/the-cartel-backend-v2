import crypto from "node:crypto";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

function userFeedFolder(userId) {
  return `${env.cloudinary.folder}/feed/${userId}`;
}

export function createFeedUploadSignature(userId) {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new ApiError(503, "MEDIA_SERVICE_UNAVAILABLE", "Media uploads are temporarily unavailable");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = userFeedFolder(userId);
  const uploadId = crypto.randomUUID();
  const publicId = `${folder}/${uploadId}`;
  const signature = cloudinary.utils.api_sign_request(
    { public_id: publicId, timestamp },
    env.cloudinary.apiSecret,
  );

  return {
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    timestamp,
    signature,
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/auto/upload`,
  };
}

export function assertOwnedMedia(media, userId) {
  const expectedPrefix = `${userFeedFolder(userId)}/`;
  for (const item of media) {
    if (!item.publicId.startsWith(expectedPrefix)) {
      throw new ApiError(403, "MEDIA_NOT_OWNED", "One or more media assets do not belong to this account");
    }
    let host;
    try {
      host = new URL(item.secureUrl).hostname;
    } catch {
      throw new ApiError(422, "INVALID_MEDIA_URL", "One or more media URLs are invalid");
    }
    if (host !== "res.cloudinary.com") {
      throw new ApiError(422, "INVALID_MEDIA_URL", "Media must be hosted by Cloudinary");
    }
  }
}

export async function deleteCloudinaryAssets(media = []) {
  const results = await Promise.allSettled(media.map((item) => cloudinary.uploader.destroy(item.publicId, {
    invalidate: true,
    resource_type: item.resourceType === "video" ? "video" : "image",
  })));
  return results.filter((result) => result.status === "rejected").length;
}
