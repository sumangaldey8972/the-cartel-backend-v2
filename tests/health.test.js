import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import app from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("returns the service health without exposing internals", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);
    assert.deepEqual(response.body, { success: true, data: { service: "the-cartel-api", status: "ok" } });
  });
});
