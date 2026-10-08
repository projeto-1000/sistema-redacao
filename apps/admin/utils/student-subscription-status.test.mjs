import assert from "node:assert/strict";
import test from "node:test";
import { getStudentSubscriptionPeriodView, isStudentCancellationScheduled } from "./student-subscription-status.ts";

test("recognizes scheduled cancellation while preserving active access", () => {
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: true, cancellation_mode: "end_of_period" }), true);
});

test("does not label completed cancellation or refund as scheduled", () => {
  assert.equal(isStudentCancellationScheduled({ status: "canceled", cancel_at_period_end: true, cancellation_mode: "end_of_period" }), false);
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: true, cancellation_mode: "withdrawal" }), false);
});

test("normal active and missing subscriptions are not scheduled", () => {
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: false, cancellation_mode: null }), false);
  assert.equal(isStudentCancellationScheduled(null), false);
});

const period = "08/10/26";
const view = (state, end = period) => getStudentSubscriptionPeriodView({ interval: "month", ...state }, end);

test("completed cancellation overrides scheduling and lifetime flags", () => {
  for (const interval of ["month", "lifetime"]) {
    const result = view({status:"canceled",cancel_at_period_end:true,interval,withdrawal_status:"refunded"});
    assert.equal(result.dateLabel, `Encerrado em ${period}`);
    assert.equal(result.cycleLabel, "Último ciclo");
    assert.match(result.description, /foram encerrados/);
  }
  assert.equal(view({status:"canceled"}, null).dateLabel, "Plano encerrado");
});

test("scheduled cancellation and courtesy preserve benefits without renewal promises", () => {
  const result = view({status:"active",cancel_at_period_end:true,cancellation_mode:"end_of_period"});
  assert.equal(result.dateLabel, `Benefícios disponíveis até ${period}`);
  assert.match(result.description, /Renovação interrompida/);
});

test("pending refunds never imply completed cancellation or guaranteed access", () => {
  for (const withdrawal_status of ["refund_processing", "operational_issue", "under_review"]) {
    const result = view({status:"active",cancel_at_period_end:true,withdrawal_status});
    assert.equal(result.cycleLabel, "Ciclo do atendimento");
    assert.match(result.description, /histórico/);
    assert.doesNotMatch(result.description, /permanecem disponíveis|foram encerrados|automática/);
  }
});

test("active, trial and payment-failure states describe their own period", () => {
  assert.equal(view({status:"active"}).dateLabel, `Renova em ${period}`);
  assert.equal(view({status:"active",interval:"lifetime"}).dateLabel, "Sem vencimento");
  assert.equal(view({status:"trial"}).dateLabel, `Período de teste até ${period}`);
  assert.match(view({status:"past_due"}).description, /atraso/);
  assert.match(view({status:"unpaid"}).description, /bloqueada/);
});
