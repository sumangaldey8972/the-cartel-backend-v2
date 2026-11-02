import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signUpSchema, verifyEmailSchema } from "../src/modules/auth/auth.validation.js";

describe("sign-up validation", () => {
  it("accepts separate first and last names", () => {
    const result = signUpSchema.safeParse({
      firstName: "Suman",
      lastName: "Dey",
      username: "sumandey",
      email: "suman@example.com",
      password: "secure-password",
    });

    assert.equal(result.success, true);
  });

  it("rejects the legacy fullName field when separate names are missing", () => {
    const result = signUpSchema.safeParse({
      fullName: "Suman Dey",
      username: "sumandey",
      email: "suman@example.com",
      password: "secure-password",
    });

    assert.equal(result.success, false);
  });
});

describe("email verification validation", () => {
  it("accepts exactly six numeric digits", () => {
    assert.equal(verifyEmailSchema.safeParse({ email: "suman@example.com", otp: "012345" }).success, true);
  });

  it("rejects non-numeric or incorrectly sized codes", () => {
    assert.equal(verifyEmailSchema.safeParse({ email: "suman@example.com", otp: "12A45" }).success, false);
    assert.equal(verifyEmailSchema.safeParse({ email: "suman@example.com", otp: "1234567" }).success, false);
  });
});
