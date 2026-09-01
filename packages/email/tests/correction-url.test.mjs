import assert from "node:assert/strict";
import test from "node:test";

import { buildEssayCorrectionUrl } from "../src/correction-url.ts";

test("builds the correction URL from a base URL without a trailing slash", () => {
  assert.equal(
    buildEssayCorrectionUrl("https://aluno.projeto1000.com.br", "essay-id"),
    "https://aluno.projeto1000.com.br/minhas-redacoes/essay-id"
  );
});

test("removes one trailing slash before building the correction URL", () => {
  assert.equal(
    buildEssayCorrectionUrl("https://aluno.projeto1000.com.br/", "essay-id"),
    "https://aluno.projeto1000.com.br/minhas-redacoes/essay-id"
  );
});

test("removes multiple trailing slashes before building the correction URL", () => {
  assert.equal(
    buildEssayCorrectionUrl("https://aluno.projeto1000.com.br///", "essay-id"),
    "https://aluno.projeto1000.com.br/minhas-redacoes/essay-id"
  );
});
