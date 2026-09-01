import { getEssayCorrectionEmailContent } from "@repo/email";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Email Preview",
};

export default function EmailPreviewPage() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- This development-only route must explicitly reject production.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { html } = getEssayCorrectionEmailContent({
    studentName: "Fernanda Felix",
    essayTitle:
      "Desafios para a reinserção socioeconômica da população em situação de rua no Brasil",
    correctionUrl: "http://localhost:3001/minhas-redacoes/preview",
  });

  return (
    <main className="min-h-dvh bg-slate-100 px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900">Email Preview</h1>
          <p className="mt-1 text-sm text-slate-600">Correção concluída</p>
        </header>

        <iframe
          className="h-[900px] w-full rounded-lg border border-slate-300 bg-white"
          sandbox=""
          srcDoc={html}
          title="Preview do e-mail de correção concluída"
        />
      </div>
    </main>
  );
}
