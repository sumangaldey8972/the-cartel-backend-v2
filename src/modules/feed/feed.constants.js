export const POST_STATUS = Object.freeze({
  PUBLISHED: "PUBLISHED",
  DELETED: "DELETED",
});

export const POST_STATUSES = Object.freeze(Object.values(POST_STATUS));

export const REPLY_PERMISSION = Object.freeze({
  EVERYONE: "EVERYONE",
  FOLLOWING: "FOLLOWING",
  MENTIONED: "MENTIONED",
});

export const REPLY_PERMISSIONS = Object.freeze(Object.values(REPLY_PERMISSION));

export const COMMENT_STATUS = Object.freeze({
  PUBLISHED: "PUBLISHED",
  DELETED: "DELETED",
});

export const COMMENT_STATUSES = Object.freeze(Object.values(COMMENT_STATUS));
