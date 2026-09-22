import assert from "node:assert/strict";
import test from "node:test";

import { getPublicStorageObjectPath } from "../src/storage.ts";

test("extracts an object path from the expected public bucket and owner folder", () => {
  assert.equal(
    getPublicStorageObjectPath(
      "https://project.supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg",
      "avatars",
      "user-id",
    ),
    "user-id/avatar.jpg",
  );
});

test("accepts the legacy owner-prefixed filename format", () => {
  assert.equal(
    getPublicStorageObjectPath(
      "https://project.supabase.co/storage/v1/object/public/avatars/user-id-123.jpg",
      "avatars",
      "user-id",
    ),
    "user-id-123.jpg",
  );
});

test("rejects URLs from another bucket or owner folder", () => {
  assert.equal(
    getPublicStorageObjectPath(
      "https://project.supabase.co/storage/v1/object/public/themes/user-id/avatar.jpg",
      "avatars",
      "user-id",
    ),
    null,
  );
  assert.equal(
    getPublicStorageObjectPath(
      "https://project.supabase.co/storage/v1/object/public/avatars/other-user/avatar.jpg",
      "avatars",
      "user-id",
    ),
    null,
  );
});

test("rejects invalid URLs", () => {
  assert.equal(getPublicStorageObjectPath("not-a-url", "avatars", "user-id"), null);
});
