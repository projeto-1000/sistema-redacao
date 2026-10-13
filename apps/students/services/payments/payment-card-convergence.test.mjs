import assert from "node:assert/strict";
import test from "node:test";

import {
  LocalPaymentCardConvergenceError,
  RemotePaymentCardNotConfirmedError,
  convergeSubscriptionPaymentCard,
} from "./payment-card-convergence.ts";

const subscriptionId = "sub_test";
const requestedPagarmeCardId = "card_requested";
const requestedLocalCardId = "local-requested";

function remoteSubscription(cardId) {
  return {
    id: subscriptionId,
    status: "active",
    card: { id: cardId },
  };
}

test("patches, confirms, and applies the requested card locally", async () => {
  let remoteCardId = "card_old";
  let patchCalls = 0;
  const localCalls = [];

  await convergeSubscriptionPaymentCard({
    subscriptionId,
    requestedPagarmeCardId,
    requestedLocalCardId,
    readRemoteSubscription: async () => remoteSubscription(remoteCardId),
    updateRemoteCard: async () => {
      patchCalls += 1;
      remoteCardId = requestedPagarmeCardId;
    },
    applyLocalCard: async (localCardId) => localCalls.push(localCardId),
    resolveLocalCardIdByPagarmeCardId: async () => {
      throw new Error("unexpected resolution");
    },
  });

  assert.equal(patchCalls, 1);
  assert.deepEqual(localCalls, [requestedLocalCardId]);
});

test("repairs only Supabase when the remote card is already requested", async () => {
  let patchCalls = 0;
  const localCalls = [];

  await convergeSubscriptionPaymentCard({
    subscriptionId,
    requestedPagarmeCardId,
    requestedLocalCardId,
    readRemoteSubscription: async () => remoteSubscription(requestedPagarmeCardId),
    updateRemoteCard: async () => {
      patchCalls += 1;
    },
    applyLocalCard: async (localCardId) => localCalls.push(localCardId),
    resolveLocalCardIdByPagarmeCardId: async () => {
      throw new Error("unexpected resolution");
    },
  });

  assert.equal(patchCalls, 0);
  assert.deepEqual(localCalls, [requestedLocalCardId]);
});

test("does not update Supabase when the remote patch is not confirmed", async () => {
  let localCalls = 0;

  await assert.rejects(
    convergeSubscriptionPaymentCard({
      subscriptionId,
      requestedPagarmeCardId,
      requestedLocalCardId,
      readRemoteSubscription: async () => remoteSubscription("card_old"),
      updateRemoteCard: async () => undefined,
      applyLocalCard: async () => {
        localCalls += 1;
      },
      resolveLocalCardIdByPagarmeCardId: async () => {
        throw new Error("unexpected resolution");
      },
    }),
    RemotePaymentCardNotConfirmedError
  );

  assert.equal(localCalls, 0);
});

test("a retry repairs Supabase after the first local update fails", async () => {
  let remoteCardId = "card_old";
  let patchCalls = 0;
  let shouldFailLocalUpdate = true;
  const localCalls = [];

  const dependencies = {
    subscriptionId,
    requestedPagarmeCardId,
    requestedLocalCardId,
    readRemoteSubscription: async () => remoteSubscription(remoteCardId),
    updateRemoteCard: async () => {
      patchCalls += 1;
      remoteCardId = requestedPagarmeCardId;
    },
    applyLocalCard: async (localCardId) => {
      if (shouldFailLocalUpdate) {
        shouldFailLocalUpdate = false;
        throw new Error("database unavailable");
      }

      localCalls.push(localCardId);
    },
    resolveLocalCardIdByPagarmeCardId: async () => {
      throw new Error("unexpected resolution");
    },
  };

  await assert.rejects(convergeSubscriptionPaymentCard(dependencies), (error) => {
    assert.ok(error instanceof LocalPaymentCardConvergenceError);
    assert.match(error.message, /Tente novamente para concluir/);
    return true;
  });

  await convergeSubscriptionPaymentCard(dependencies);

  assert.equal(patchCalls, 1);
  assert.deepEqual(localCalls, [requestedLocalCardId]);
});

test("converges locally when another operation changes the remote card after the RPC", async () => {
  const remoteReads = ["card_old", requestedPagarmeCardId, "card_concurrent"];
  const localCalls = [];
  const resolvedCards = [];

  await convergeSubscriptionPaymentCard({
    subscriptionId,
    requestedPagarmeCardId,
    requestedLocalCardId,
    readRemoteSubscription: async () => remoteSubscription(remoteReads.shift()),
    updateRemoteCard: async () => undefined,
    applyLocalCard: async (localCardId) => localCalls.push(localCardId),
    resolveLocalCardIdByPagarmeCardId: async (pagarmeCardId) => {
      resolvedCards.push(pagarmeCardId);
      return "local-concurrent";
    },
  });

  assert.deepEqual(resolvedCards, ["card_concurrent"]);
  assert.deepEqual(localCalls, [requestedLocalCardId, "local-concurrent"]);
});
