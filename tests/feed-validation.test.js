import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractHashtags } from "../src/modules/feed/feed.service.js";
import { createPostSchema, paginationQuerySchema } from "../src/modules/feed/feed.validation.js";

describe("feed validation", () => {
  it("preserves formatted content and extracts unique inline hashtags", () => {
    const content = "First paragraph\n\nSecond paragraph\n#Markets #BTC #markets #বাংলা";
    const parsed = createPostSchema.parse({ content });
    assert.equal(parsed.content, content);
    assert.deepEqual(extractHashtags(parsed.content), ["#markets", "#btc", "#বাংলা"]);
  });

  it("accepts media-only posts and rejects empty posts", () => {
    const mediaOnly = createPostSchema.safeParse({
      media: [{
        publicId: "the_cartel/feed/user-id/asset-id",
        secureUrl: "https://res.cloudinary.com/demo/image/upload/asset.jpg",
        resourceType: "image",
        cropAspect: "4 / 5",
        cropX: 42,
        cropY: 58,
        zoom: 1.35,
      }],
    });
    assert.equal(mediaOnly.success, true);
    assert.equal(mediaOnly.data.media[0].cropAspect, "4 / 5");
    assert.equal(mediaOnly.data.media[0].zoom, 1.35);
    assert.equal(createPostSchema.safeParse({ content: "   ", media: [] }).success, false);
  });

  it("caps feed pagination to fifty records", () => {
    assert.equal(paginationQuerySchema.parse({ page: "2", limit: "50" }).page, 2);
    assert.equal(paginationQuerySchema.safeParse({ limit: "51" }).success, false);
  });
});
