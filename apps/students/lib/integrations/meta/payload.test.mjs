import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  buildQueuedRegistration,
  buildRegistrationPayload,
  sendRegistrationEvent,
  registrationRetryAt,
} from "./payload.ts";
import { trackCompleteRegistration } from "../../meta-pixel.ts";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const event = {
  user_id: "student-id",
  event_id: "registration:student-id",
  event_time: "2026-10-22T12:00:00Z",
  email_hash: hash("student@example.test"),
  phone_hash: hash("5511999990000"),
  attempts: 1,
  locked_until: "2026-10-22T12:02:00Z",
  attribution: {
    fbc: "fb.1.1792670400000.click",
    fbp: "fb.1.1792670400000.123",
    client_ip_address: "192.0.2.1",
    client_user_agent: "Test browser",
    event_source_url: "https://app.projeto1000.com.br/cadastro/senha?token=secret",
    utm_source: "meta",
    fbclid: "click",
  },
};

test("payload includes hashed contacts and unmodified matching cookies, IP and agent", () => {
  const payload = buildRegistrationPayload(event);
  assert.equal(payload.event_name, "CompleteRegistration");
  assert.equal(payload.action_source, "website");
  assert.equal(payload.event_id, event.event_id);
  assert.equal(payload.event_time, 1792670400);
  assert.equal(payload.event_source_url, "https://app.projeto1000.com.br/cadastro/senha");
  assert.deepEqual(payload.user_data, {
    em: [event.email_hash],
    ph: [event.phone_hash],
    fbc: event.attribution.fbc,
    fbp: event.attribution.fbp,
    client_ip_address: "192.0.2.1",
    client_user_agent: "Test browser",
  });
  assert.deepEqual(payload.custom_data, { utm_source: "meta" });
  assert.ok(!JSON.stringify(payload).includes("student@example.test"));
  assert.ok(!JSON.stringify(payload).includes("secret"));
});

test("invalid cookies, unhashed contacts and invalid IP are omitted", () => {
  const payload = buildRegistrationPayload({
    ...event,
    email_hash: "raw@email.test",
    phone_hash: "5511999990000",
    attribution: { fbc: "invalid", fbp: "invalid", client_ip_address: "spoofed" },
  });
  assert.deepEqual(payload.user_data, {});
});

test("browser and server share the exact event name and event identifier", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  let args;
  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        fbq: (...values) => {
          args = values;
        },
      },
    });
    trackCompleteRegistration(event.event_id);
    const server = buildRegistrationPayload(event);
    assert.deepEqual(args, ["track", server.event_name, {}, { eventID: server.event_id }]);
    globalThis.window.fbq = () => {
      throw new Error("blocked");
    };
    assert.doesNotThrow(() => trackCompleteRegistration(event.event_id));
    delete globalThis.window.fbq;
    assert.doesNotThrow(() => trackCompleteRegistration(event.event_id));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete globalThis.window;
  }
});

test("delivery uses the correct pixel, a private token header and Test Events code", async () => {
  let calls = 0;
  const result = await sendRegistrationEvent({
    event,
    accessToken: "test-token",
    testEventCode: "TEST_LOCAL",
    fetcher: async (url, options) => {
      calls++;
      assert.equal(url, "https://graph.facebook.com/v26.0/1498795297218230/events");
      assert.ok(!url.includes("test-token"));
      assert.equal(options.headers.Authorization, "Bearer test-token");
      assert.equal(JSON.parse(options.body).test_event_code, "TEST_LOCAL");
      assert.equal(JSON.parse(options.body).data[0].event_id, event.event_id);
      return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { success: true });
});

test("HTTP rejection, missing acknowledgement and network errors remain retryable", async () => {
  for (const [fetcher, code] of [
    [async () => new Response("sensitive error body", { status: 429 }), "HTTP_429"],
    [async () => new Response(JSON.stringify({ events_received: 0 })), "NOT_ACKNOWLEDGED"],
    [
      async () => {
        throw new Error("sensitive error message");
      },
      "REQUEST_FAILED",
    ],
    [async () => new Response("malformed"), "REQUEST_FAILED"],
  ]) {
    assert.deepEqual(await sendRegistrationEvent({ event, accessToken: "test-token", fetcher }), {
      success: false,
      code,
    });
  }
  assert.equal(registrationRetryAt(1, 0), new Date(120000).toISOString());
  assert.equal(registrationRetryAt(99, 0), new Date(6 * 60 * 60 * 1000).toISOString());
});

test("post-signup persistence snapshots normalized contact hashes without raw contacts", () => {
  const queued = buildQueuedRegistration({
    userId: "created-user",
    createdAt: event.event_time,
    email: " Student@Example.Test ",
    phoneCountryCode: "+55",
    phone: "(11) 99999-0000",
    attribution: event.attribution,
  });
  assert.equal(queued.user_id, "created-user");
  assert.equal(queued.event_id, "registration:created-user");
  assert.equal(queued.event_time, event.event_time);
  assert.equal(queued.email_hash, hash("student@example.test"));
  assert.equal(queued.phone_hash, hash("5511999990000"));
  assert.equal(queued.email, undefined);
  assert.equal(queued.phone, undefined);
});
