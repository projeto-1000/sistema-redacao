import "server-only";

import OpenAI from "openai";

export const OPENAI_OCR_MODELS = {
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
  sol: "gpt-5.6-sol",
} as const;

export type OpenAiOcrModel = keyof typeof OPENAI_OCR_MODELS;

const TRANSCRIPTION_PROMPT = `
Sua única tarefa é TRANSCRIÇÃO LITERAL de uma redação manuscrita.

IMPORTANTE:
Você NÃO é um corretor de texto.
Você NÃO deve melhorar, interpretar ou reescrever a redação.
Seu objetivo é reproduzir exatamente o que o aluno escreveu.

REGRAS OBRIGATÓRIAS:

1. Transcreva somente o texto pertencente à redação do aluno.

2. Preserve exatamente os erros presentes no original.
   NÃO corrija:
   - ortografia;
   - acentuação;
   - pontuação;
   - concordância;
   - regência;
   - gramática;
   - uso de maiúsculas/minúsculas;
   - escolha de palavras.

3. Nunca substitua uma palavra escrita pelo aluno por uma forma que pareça
   mais correta ou mais provável pelo contexto.

   Exemplo:
   se o aluno escreveu "concerteza",
   a saída deve ser "concerteza",
   e NÃO "com certeza".

4. Não complete frases com base no contexto.

5. Não reformule frases.

6. Não melhore coesão, clareza ou estilo.

7. Preserve os parágrafos do texto original.

   IMPORTANTE:
   - Não reproduza as quebras de linha físicas da folha.
   - Uma mudança de linha causada apenas pelo limite da folha NÃO representa
     um novo parágrafo.
   - Una linhas consecutivas do mesmo parágrafo usando um espaço normal.
   - Só insira uma quebra de parágrafo quando houver evidência visual de que
     o aluno realmente iniciou um novo parágrafo, como recuo no início da
     linha ou separação clara entre blocos.

   Exemplo:

   Na folha:
   "O debate sobre o comércio internacional é bastante"
   "importante para a economia brasileira."

   Saída correta:
   "O debate sobre o comércio internacional é bastante importante para a economia brasileira."

   Saída incorreta:
   "O debate sobre o comércio internacional é bastante
   importante para a economia brasileira."

8. Quando uma palavra estiver dividida somente porque chegou ao fim da linha
   física da folha, reconstrua a palavra sem o hífen de quebra de linha.

   Exemplo:
   "constitui-" no fim de uma linha + "ção" na linha seguinte
   deve resultar em "constituição".

   Porém, não altere nenhuma outra letra da palavra.

9. Rasuras:
   - se uma palavra estiver claramente riscada e substituída por outra,
     considere apenas a versão final escrita pelo aluno;
   - se não for possível determinar com segurança qual texto deve ser
     considerado, use [ilegível].

10. Se não for possível identificar uma palavra ou trecho com segurança,
    escreva [ilegível].
    NÃO tente adivinhar usando o sentido da frase.

11. Ignore elementos que não fazem parte da redação, como:
    - números das linhas;
    - cabeçalhos;
    - rodapés;
    - instruções impressas;
    - número de inscrição;
    - nome do candidato;
    - assinatura;
    - campos de formulário;
    - textos impressos da folha.

12. Retorne SOMENTE a transcrição.
    Não escreva introduções, comentários, explicações, observações ou markdown.
`.trim();

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  return new OpenAI({ apiKey });
}

export async function transcribeEssayWithOpenAI({
  fileUrl,
  filename,
  contentType,
  model,
}: {
  fileUrl: string;
  filename: string;
  contentType: string;
  model: OpenAiOcrModel;
}) {
  const client = getClient();

  const modelId = OPENAI_OCR_MODELS[model];

  const fileInput =
    contentType === "application/pdf"
      ? {
          type: "input_file" as const,
          filename,
          file_url: fileUrl,
        }
      : {
          type: "input_image" as const,
          image_url: fileUrl,
          detail: "high" as const,
        };

  const response = await client.responses.create({
    model: modelId,
    reasoning: {
      effort: "none",
    },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: TRANSCRIPTION_PROMPT,
          },
          fileInput,
        ],
      },
    ],
  });

  return {
    text: response.output_text.trim(),
    model: modelId,
    usage: response.usage,
  };
}
