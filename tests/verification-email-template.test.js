import test from "node:test";
import assert from "node:assert/strict";
import { renderVerificationEmail } from "../src/templates/verification-email.template.js";

test("verification email renders the premium briefing design", () => {
  const html = renderVerificationEmail({ firstName: "Sumangal", otp: "688928" });

  assert.match(html, /PRIVATE SECURITY BRIEFING/i);
  assert.match(html, /Hi Sumangal,/);
  assert.match(html, /6[\s\S]*8[\s\S]*8[\s\S]*9[\s\S]*2[\s\S]*8/);
  assert.match(html, /This code expires in 5 minutes\./);
  assert.match(html, /cid:cartel-brand-logo/);
  assert.match(html, /cid:cartel-brand-mark/);
});

test("verification email escapes user-controlled values", () => {
  const html = renderVerificationEmail({
    firstName: '<script>alert("name")</script>',
    otp: "123456",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&quot;name&quot;\)&lt;\/script&gt;/);
});
