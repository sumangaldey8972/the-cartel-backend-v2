# Feed module

Base path: `/api/v1/feed`

MongoDB is the source of truth for posts, comments, likes, shares, tags, and counters. Supabase is used only to broadcast successful MongoDB mutations on the public `feed` topic.

## Publishing flow

1. An authenticated client calls `POST /media/signature` once per image or video.
2. The client uploads directly to the returned Cloudinary `uploadUrl` with `XMLHttpRequest`. Use `xhr.upload.onprogress` to show byte progress without buffering the file in the Node/Vercel process.
3. The client sends the returned Cloudinary asset metadata in `POST /posts`.
4. The API verifies that every `publicId` belongs to the signed-in user's Cloudinary folder, extracts inline `#hashtags`, writes the post to MongoDB, updates tag usage, and broadcasts `post.created` through Supabase.

Example post body:

```json
{
  "content": "First paragraph.\n\nSecond paragraph.\n\n#markets #btc",
  "replyPermission": "EVERYONE",
  "media": [
    {
      "publicId": "the_cartel/feed/USER_ID/UPLOAD_ID",
      "secureUrl": "https://res.cloudinary.com/...",
      "resourceType": "image",
      "format": "webp",
      "width": 1600,
      "height": 900,
      "bytes": 245000,
      "altText": "Market chart",
      "taggedPeople": [],
      "madeWithAi": false,
      "cropAspect": "16 / 9",
      "cropX": 50,
      "cropY": 50,
      "zoom": 1
    }
  ]
}
```

Do not send a separate `tags` field. The API derives unique, lowercase hashtags from `content` so display content and discovery data cannot drift apart.

## Supabase events

Clients can subscribe to the public `feed` channel. Events are:

- `post.created`, `post.updated`, `post.deleted`
- `post.liked`, `post.unliked`
- `post.shared`, `post.unshared`
- `comment.created`, `comment.updated`, `comment.deleted`

Broadcast delivery is best-effort and has a two-second timeout. A Supabase outage never rolls back an already successful MongoDB mutation.

## Cleanup and memory behavior

- Files upload directly from the browser to Cloudinary; the API does not retain file buffers.
- Deleted posts are soft-deleted in MongoDB, interaction records are removed, inline-tag usage is decremented, and Cloudinary assets are invalidated and destroyed.
- Supabase broadcasts use one HTTP request per event and create no persistent server listeners or WebSocket connections.
- Like and share creation is idempotent through unique compound indexes.

The complete request and response contract is available at `/api/docs` and `/api/docs.json`.
