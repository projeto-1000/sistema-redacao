import assert from "node:assert/strict";
import test from "node:test";
import { courtesyDateToIso, getSupportConsequences } from "./subscription-support.ts";

const input = {
  availableCredits: 4,
  courtesyCredits: 2,
  periodEndLabel: "24/10/2026, 20:59",
  courtesyUntilLabel: "20/10/2026",
};

test("cancel/refund explains immediate credit hold and later confirmed ending", () => {
  const result = getSupportConsequences({ ...input, action: "cancel_refund" });
  assert.match(result.credits, /4 créditos.*bloqueados ao iniciar/);
  assert.match(result.period, /após a confirmação do reembolso/);
  assert.match(result.renewal, /Sem novas cobranças/);
});
test("cancel-only retains current credits through the paid period", () => {
  const result = getSupportConsequences({ ...input, action: "cancel_only" });
  assert.match(result.period, /24\/10\/2026/);
  assert.match(result.credits, /4 créditos.*sem bloqueio/);
});
test("courtesy shows retained and blocked quantities and exact selected date", () => {
  const result = getSupportConsequences({ ...input, action: "refund_courtesy" });
  assert.match(result.period, /20\/10\/2026/);
  assert.match(result.credits, /2 créditos existentes mantidos/);
  assert.match(result.credits, /2 créditos bloqueados/);
  assert.match(result.credits, /Nenhum crédito novo/);
});
test("refund-only explicitly preserves future charges and benefits", () => {
  const result = getSupportConsequences({ ...input, action: "refund_only" });
  assert.match(result.renewal, /Continua normalmente, com novas cobranças/);
  assert.match(result.credits, /sem alteração de saldo ou validade/);
  assert.match(result.period, /Plano mantido/);
});

test("courtesy on the last paid day ends at 23:59 Brasília, not the provider UTC hour", () => {
  assert.equal(courtesyDateToIso("2026-10-24", "2026-10-24T23:59:59Z"), "2026-10-25T02:59:59.000Z");
});
