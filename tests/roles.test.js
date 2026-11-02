import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { authorizeRoles } from "../src/modules/auth/auth.middleware.js";

describe("authorizeRoles", () => {
  it("allows a user when any assigned role is accepted", () => {
    const next = mock.fn();
    authorizeRoles("PUBLISHER", "ADMIN")(
      { auth: { user: { roles: ["USER", "PUBLISHER"] } } },
      {},
      next,
    );
    assert.equal(next.mock.callCount(), 1);
    assert.deepEqual(next.mock.calls[0].arguments, []);
  });

  it("rejects a user when none of their roles are accepted", () => {
    const next = mock.fn();
    authorizeRoles("ADMIN")(
      { auth: { user: { roles: ["USER", "PUBLISHER"] } } },
      {},
      next,
    );
    assert.equal(next.mock.callCount(), 1);
    assert.equal(next.mock.calls[0].arguments[0].statusCode, 403);
    assert.equal(next.mock.calls[0].arguments[0].code, "INSUFFICIENT_PERMISSIONS");
  });
});
