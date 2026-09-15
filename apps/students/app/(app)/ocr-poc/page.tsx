"use client";

import { ChangeEvent, useEffect, useState } from "react";

interface TranscriptionResult {
  text: string;
  lowConfidenceWords: {
    text: string;
    confidence: number;
  }[];
}

export default function OcrPocPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setTranscription("");
    setError(null);
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setTranscription("");
    setError(null);
  }

  async function handleTranscribe() {
    if (!file) {
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ocr/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Não foi possível transcrever a redação.");
      }

      const data = (await response.json()) as TranscriptionResult;

      setResult(data);
      setTranscription(data.text);
    } catch (err) {
      console.error(err);
      setError("Não foi possível transcrever a redação.");
    } finally {
      setIsTranscribing(false);
    }
  }

  function handleConfirmTranscription() {
    console.log("Transcrição confirmada:", transcription);
  }

  if (result && file && previewUrl) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">
              Confira a transcrição
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Compare o texto transcrito com a sua redação original e
              corrija qualquer diferença antes de continuar.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Redação original
                </h2>

                <p className="text-sm text-muted-foreground">
                  Use o arquivo enviado como referência durante a revisão.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-muted/30">
                {file.type === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="Redação original"
                    className="h-[650px] w-full"
                  />
                ) : (
                  <div className="flex h-[650px] items-start justify-center overflow-auto p-4">
                    <img
                      src={previewUrl}
                      alt="Redação original"
                      className="max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Transcrição
                </h2>

                <p className="text-sm text-muted-foreground">
                  O texto abaixo pode ser editado livremente.
                </p>
              </div>

              <textarea
                value={transcription}
                onChange={(event) => setTranscription(event.target.value)}
                className="h-[650px] w-full resize-none rounded-lg border bg-background p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
              />
            </section>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Enviar outro arquivo
            </button>

            <button
              type="button"
              onClick={handleConfirmTranscription}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Confirmar transcrição
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Envie sua redação
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Envie uma foto ou PDF da sua redação para que possamos
            transcrevê-la.
          </p>
        </div>

        {!file ? (
          <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <span className="font-medium">
              Clique para selecionar sua redação
            </span>

            <span className="mt-2 text-sm text-muted-foreground">
              JPG, PNG ou PDF
            </span>

            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">
                Confira o arquivo
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Verifique se a redação está completa, legível e na
                orientação correta antes de continuar.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border bg-muted/30">
              {previewUrl &&
                (file.type === "application/pdf" ? (
                  <iframe
                    src={previewUrl}
                    title="Prévia da redação"
                    className="h-[600px] w-full"
                  />
                ) : (
                  <div className="flex max-h-[700px] justify-center overflow-auto p-4">
                    <img
                      src={previewUrl}
                      alt="Prévia da redação"
                      className="max-w-full object-contain"
                    />
                  </div>
                ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {file.name}
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isTranscribing}
                className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Trocar arquivo
              </button>

              <button
                type="button"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {isTranscribing
                  ? "Transcrevendo..."
                  : "Sim, continuar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
