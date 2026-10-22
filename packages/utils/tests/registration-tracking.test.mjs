import assert from "node:assert/strict";
import test from "node:test";
import {
  collectRegistrationAttribution as collect,
  captureRegistrationAttribution,
  registrationEventId,
  trackingPageUrl,
  ATTRIBUTION_MAX_AGE_MS,
} from "../src/registration-tracking.ts";

const now = 1792670400000;
const landing =
  "https://www.projeto1000.com.br/?utm_source=meta&utm_campaign=enem&fbclid=click_123";
function saved(attribution, savedAt = now) {
  return JSON.stringify({ savedAt, attribution });
}

test("captures an ad on the landing and preserves attribution on internal signup navigation", () => {
  const first = collect({ url: landing, cookies: "_fbp=fb.1.1792670400000.987", now });
  assert.equal(first.utm_source, "meta");
  assert.equal(first.fbc, `fb.1.${now}.click_123`);
  assert.equal(first.fbp, "fb.1.1792670400000.987");
  assert.equal(first.landing_url, "https://www.projeto1000.com.br/");
  assert.deepEqual(
    collect({
      url: "https://www.projeto1000.com.br/cadastro",
      cookies: "",
      stored: saved(first),
      now: now + 100,
    }),
    first
  );
});

test("a new ad click replaces an old campaign and never reuses its click cookie", () => {
  const result = collect({
    url: landing,
    cookies: "_fbc=fb.1.1792670400000.old",
    stored: saved({ utm_term: "old", fbclid: "old", fbc: "fb.1.1792670400000.old" }),
    now,
  });
  assert.equal(result.utm_term, undefined);
  assert.equal(result.fbc, `fb.1.${now}.click_123`);
});

test("uses genuine cookies without inventing a click for an organic visit", () => {
  const result = collect({
    url: "https://www.projeto1000.com.br/",
    cookies: "_fbc=fb.1.1792670400000.real; _fbp=fb.1.1792670400000.99",
    now,
  });
  assert.equal(result.fbc, "fb.1.1792670400000.real");
  assert.equal(
    collect({ url: "https://www.projeto1000.com.br/", cookies: "", now }).fbc,
    undefined
  );
});

test("expired, malformed and future storage cannot restore stale attribution", () => {
  for (const stored of [
    "broken",
    saved({ utm_source: "stale" }, now - ATTRIBUTION_MAX_AGE_MS),
    saved({ utm_source: "future" }, now + 1),
  ]) {
    assert.equal(
      collect({ url: "https://www.projeto1000.com.br/cadastro", cookies: "", stored, now })
        .utm_source,
      undefined
    );
  }
});

test("source URLs never contain passwords, query tokens, fragments or credentials", () => {
  assert.equal(
    trackingPageUrl(
      "https://name:password@app.projeto1000.com.br/cadastro/senha?token=secret#private"
    ),
    "https://app.projeto1000.com.br/cadastro/senha"
  );
  assert.equal(trackingPageUrl("javascript:alert(1)"), undefined);
});

test("blocked browser storage and cookies do not stop signup attribution capture", () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: { href: landing },
        get localStorage() {
          throw new Error("blocked");
        },
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    assert.equal(captureRegistrationAttribution().fbclid, "click_123");
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else delete globalThis.window;
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete globalThis.document;
  }
});

test("all methods use the same stable event identifier for one created account", () => {
  assert.equal(registrationEventId("student-id"), "registration:student-id");
  assert.notEqual(registrationEventId("student-id"), registrationEventId("other-student"));
});
