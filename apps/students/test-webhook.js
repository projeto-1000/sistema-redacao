// test-webhook.js
const testWebhook = async () => {
  const response = await fetch("http://localhost:3001/api/webhooks/hotmart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ⚠️ Coloque aqui o mesmo token que está no seu .env.local
      "x-hotmart-hottok": "seu_hottok_aqui",
    },
    body: JSON.stringify({
      event: "PURCHASE_APPROVED",
      data: {
        product: { id: 99999, name: "Mentoria de Teste" },
        buyer: {
          email: "fernandaleitefelix@gmail.com", // E-mail que receberá o convite
          name: "Aluno Teste",
        },
        purchase: {
          // O Date.now() cria uma transação única para não cair na regra de idempotência (onConflict)
          transaction: "TESTE-" + new Date(),
          status: "APPROVED",
        },
      },
    }),
  });

  // const result = await response.json();
  // console.log("Status HTTP:", response.status);

  const resultText = await response.text();
  console.log("Status HTTP:", response.status);
  console.log("Resposta Real do Servidor:", resultText.substring(0, 200));
};

testWebhook();
