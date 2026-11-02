# Authentication

The Cartel uses opaque server-side sessions for its browser application. The browser receives an HTTP-only cookie; only a SHA-256 hash of the random session token is stored in MongoDB.

## Roles

A user can hold multiple roles simultaneously. Supported roles are `USER`, `PUBLISHER`, `ADVERTISER`, `MODERATOR`, `ADMIN`, and `SUPER_ADMIN`.

Public sign-up always creates a user with only the `USER` role. Role changes must be performed by a future protected administrative workflow and can never be supplied by a sign-up request.

Sign-up accepts `firstName` and `lastName` as separate required fields. The API stores and returns them separately; it does not accept a combined `fullName` field.

## Email verification

New accounts are stored with `PENDING` status and receive a six-digit code through the configured Nodemailer SMTP transport. The code expires after five minutes. The backend stores only a bcrypt hash of the code, never the code itself.

`POST /api/v1/auth/verify-email` accepts the email address and code. A valid code is atomically marked as consumed, the user becomes `ACTIVE`, `emailVerifiedAt` is recorded, and only then is an HTTP-only session cookie issued.

`POST /api/v1/auth/resend-verification-otp` invalidates the previous code and sends a new one. A 60-second resend cooldown, five-attempt verification limit, per-email hourly limit, and per-IP hourly limit are persisted in MongoDB so protection works across Vercel instances. Responses for unknown resend emails are deliberately generic to reduce account enumeration.

Users whose email is not verified cannot sign in.

Authorization succeeds when the authenticated user has at least one role allowed by a protected route.

## Browser requests

Frontend requests must include credentials:

```js
fetch(`${API_URL}/api/v1/auth/me`, {
  credentials: "include",
});
```

The frontend origin must be listed in `CLIENT_ORIGIN`. Production should use custom domains under the same parent domain, or proxy backend requests through the user application, so cookie behavior remains predictable.

## Secrets

Never add the MongoDB URL, cookies, passwords, or production environment values to this directory. Configure production values through the Vercel project environment settings.

Required mail settings are `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`. Keep them only in the local `.env` file and Vercel environment settings.
