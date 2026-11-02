export const ROLE_CODES = Object.freeze([
  "USER",
  "PUBLISHER",
  "ADVERTISER",
  "MODERATOR",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const DEFAULT_ROLE_CODE = "USER";

export const SYSTEM_ROLE_DEFINITIONS = Object.freeze([
  { code: "USER", name: "User", description: "Standard account created through The Cartel user application" },
  { code: "PUBLISHER", name: "Publisher", description: "Publishes verified editorial and market content" },
  { code: "ADVERTISER", name: "Advertiser", description: "Manages advertising activity" },
  { code: "MODERATOR", name: "Moderator", description: "Moderates community content and activity" },
  { code: "ADMIN", name: "Administrator", description: "Manages operational areas of The Cartel" },
  { code: "SUPER_ADMIN", name: "Super administrator", description: "Has full platform administration access" },
]);
