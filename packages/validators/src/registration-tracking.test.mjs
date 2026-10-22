import assert from "node:assert/strict";
import test from "node:test";
import { parseRegistrationAttribution } from "./registration-tracking.ts";

test("only allows marketing fields and drops malicious or malformed fields independently", () => {
  assert.deepEqual(
    parseRegistrationAttribution({
      utm_source: "meta",
      fbc: "broken",
      password: "never-store",
      client_ip_address: "spoofed",
      landing_url: "https://www.projeto1000.com.br/cadastro?token=secret",
    }),
    { utm_source: "meta", landing_url: "https://www.projeto1000.com.br/cadastro" }
  );
  assert.deepEqual(parseRegistrationAttribution(null), {});
  assert.deepEqual(parseRegistrationAttribution({ utm_source: "x".repeat(501) }), {});
});

test("optional metadata exceeding the byte budget does not reject signup", () => {
  assert.deepEqual(
    parseRegistrationAttribution(
      Object.fromEntries(
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"].map(
          (key) => [key, "🟢".repeat(250)]
        )
      )
    ),
    {}
  );
});
