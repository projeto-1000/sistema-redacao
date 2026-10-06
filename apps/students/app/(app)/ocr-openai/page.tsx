"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/client";

type Model = "luna" | "terra" | "sol";

type Result = {
  text?: string;
  model?: string;
  error?: string;
  loading?: boolean;
};

const MODELS: {
  id: Model;
  name: string;
}[] = [
    {
      id: "luna",
      name: "GPT-5.6 Luna",
    },
    {
      id: "terra",
      name: "GPT-5.6 Terra",
    },
    {
      id: "sol",
      name: "GPT-5.6 Sol",
    },
  ];

export default function OpenAiOcrPage() {
  const supabase = useMemo(() => createClient(), []);

  const [file, setFile] = useState<File | null>(null);

  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


  const [results, setResults] = useState<Record<Model, Result>>({
    luna: {},
    terra: {},
    sol: {},
  });

  const previewUrl = useMemo(() => {
    if (!file) return null;

    return URL.createObjectURL(file);
  }, [file]);

  async function uploadFileToSupabase(selectedFile: File) {
    setUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const extension = selectedFile.name.split(".").pop() ?? "file";

      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("ocr-poc-temp")
        .upload(path, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadedPath(path);

      return path;
    } finally {
      setUploading(false);
    }
  }

  async function transcribe(model: Model) {
    if (!file || !uploadedPath) return;

    setResults((current) => ({
      ...current,
      [model]: {
        loading: true,
      },
    }));

    try {
      const response = await fetch(`/api/ocr/openai/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: uploadedPath,
          filename: file.name,
          contentType: file.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Não foi possível transcrever a redação.",
        );
      }

      setResults((current) => ({
        ...current,
        [model]: {
          text: data.text,
          model: data.model,
        },
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [model]: {
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível transcrever a redação.",
        },
      }));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">
          POC OCR — OpenAI
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Envie a mesma redação e compare a transcrição dos três modelos.
        </p>
      </div>

      <div className="rounded-xl border p-6">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <span className="font-medium">
            Selecione uma redação
          </span>

          <span className="text-sm text-muted-foreground">
            JPG, PNG ou PDF
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;

              setFile(selectedFile);
              setUploadedPath(null);

              setResults({
                luna: {},
                terra: {},
                sol: {},
              });

              if (selectedFile) {
                void uploadFileToSupabase(selectedFile);
              }
            }}
          />
        </label>

        {file && (
          <p className="mt-3 text-sm text-muted-foreground">
            Arquivo selecionado: {file.name}
          </p>
        )}
      </div>

      {file && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border p-4">
            <h2 className="mb-4 font-semibold">
              Redação original
            </h2>

            {file.type === "application/pdf" ? (
              <iframe
                src={previewUrl ?? undefined}
                className="h-[700px] w-full rounded-lg border"
                title="Preview da redação"
              />
            ) : (
              <img
                src={previewUrl ?? undefined}
                alt="Redação enviada"
                className="max-h-[700px] w-full rounded-lg object-contain"
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            {MODELS.map((model) => {
              const result = results[model.id];

              return (
                <div
                  key={model.id}
                  className="rounded-xl border p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="font-semibold">
                      {model.name}
                    </h2>

                    <button
                      type="button"
                      disabled={result.loading || uploading || !uploadedPath}
                      onClick={() => transcribe(model.id)}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {result.loading
                        ? "Transcrevendo..."
                        : "Transcrever"}
                    </button>
                  </div>

                  {result.error && (
                    <p className="text-sm text-destructive">
                      {result.error}
                    </p>
                  )}

                  {result.text && (
                    <textarea
                      value={result.text}
                      readOnly
                      className="min-h-[260px] w-full resize-y rounded-md border bg-background p-3 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}