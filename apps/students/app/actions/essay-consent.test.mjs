import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

// Exercise the real Server Actions with isolated data/integration boundaries.
function loadAction(filename) {
  const writes = [];
  const chain = {
    eq() {
      return chain;
    },
    then(resolve, reject) {
      return Promise.resolve({ error: null }).then(resolve, reject);
    },
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "test-student" } } }) },
    rpc: async (name, payload) => {
      writes.push({ operation: "rpc", name, payload });
      return { error: null };
    },
    from: (table) => ({
      insert: async (payload) => {
        writes.push({ operation: "insert", table, payload });
        return { error: null };
      },
      update: (payload) => {
        writes.push({ operation: "update", table, payload });
        return chain;
      },
      delete: () => chain,
    }),
  };
  const modules = {
    "@/lib/server": { createClient: async () => client },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect() {} },
    "@/lib/integrations/datacrazy/sync-student": {
      syncStudentToDataCrazy: async () => {},
      getDataCrazySyncErrorCode: () => "test-error",
    },
    "@/lib/essay-source-files": {},
    "@/lib/server/essay-source-storage": {},
  };
  const source = readFileSync(new URL(filename, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Script(outputText, { filename }).runInNewContext({
    exports,
    FormData,
    console: { info() {}, error() {} },
    require(id) {
      if (!(id in modules)) throw new Error(`Unmocked dependency: ${id}`);
      return modules[id];
    },
  });
  return { actions: exports, writes };
}

for (const consent of [false, true]) {
  test(`submission saves exemplar consent=${consent} without pedagogical consent`, async () => {
    const { actions, writes } = loadAction("./submit-essay.ts");
    const form = new FormData();
    form.set("content", "Redação de teste. ".repeat(20));
    form.set("best_essay_consent", String(consent));
    form.set("source_file_id", "test-source");
    await actions.submitEssay("test-topic", "Tema", "Cultura", null, form);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].name, "submit_essay_with_source");
    assert.equal(writes[0].payload.p_best_essay_consent, consent);
    assert.equal(writes[0].payload.p_pedagogical_use_consent, false);
    assert.equal(writes[0].payload.p_source_file_id, "test-source");
  });

  for (const existingDraft of [false, true]) {
    test(`${existingDraft ? "updated" : "new"} draft saves exemplar consent=${consent} only`, async () => {
      const { actions, writes } = loadAction("./essay-drafts.ts");
      await actions.saveDraft(
        "test-topic",
        "Redação de teste",
        "Tema",
        "Cultura",
        consent,
        null,
        existingDraft ? "test-draft" : undefined
      );
      assert.equal(writes.length, 1);
      assert.equal(writes[0].operation, existingDraft ? "update" : "insert");
      assert.equal(writes[0].payload.best_essay_consent, consent);
      assert.equal(writes[0].payload.pedagogical_use_consent, false);
    });
  }
}

test("the former broad checkbox cannot grant either consent on a new submission", async () => {
  const { actions, writes } = loadAction("./submit-essay.ts");
  const form = new FormData();
  form.set("content", "Redação de teste. ".repeat(20));
  form.set("pedagogical_use_consent", "true");
  await actions.submitEssay("test-topic", "Tema", "Cultura", null, form);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].payload.p_best_essay_consent, false);
  assert.equal(writes[0].payload.p_pedagogical_use_consent, false);
});
