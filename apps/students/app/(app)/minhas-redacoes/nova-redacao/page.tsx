import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getTopicDetails } from "@/app/actions/get-topics";
import { getReturnedEssayReuseSource } from "@/app/actions/get-essays";
import { EssayWorkspace } from "@/components/essay-workspace";
import { getDraftEssay, getTemporaryBackup } from "@/app/actions/essay-drafts";
import { getCurrentStudentCreditSummary } from "@/app/actions/credits";
import { EssayDraft } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nova redação",
};

type Props = {
  searchParams: Promise<{
    id: string;
    success?: string;
    mode?: string;
    source?: string;
  }>;
};

export default async function NewEssayPage(props: Props) {
  const searchParams = await props.searchParams;
  const topicId = searchParams.id;
  const mode =
    searchParams.mode === "reuse" || searchParams.mode === "blank"
      ? searchParams.mode
      : undefined;
  const sourceEssayId = searchParams.source;

  if (!topicId) {
    redirect("/temas");
  }
  const isSuccess = searchParams.success === "true";

  const [essayTopic, creditSummary, returnedEssaySource] = await Promise.all([
    getTopicDetails(topicId),
    getCurrentStudentCreditSummary(),
    mode === "reuse" && sourceEssayId
      ? getReturnedEssayReuseSource(sourceEssayId, topicId)
      : Promise.resolve(null),
  ]);

  let tempBackup = null;
  let officialDraft = null;

  if (essayTopic && !isSuccess) {
    officialDraft = await getDraftEssay(topicId);

    if (!mode) {
      tempBackup = await getTemporaryBackup(topicId);
    }
  }

  if (mode === "reuse" && !returnedEssaySource) {
    notFound();
  }

  const latestDraft = [tempBackup, officialDraft]
    .filter(Boolean)
    .sort((a, b) => new Date(b?.updated_at).getTime() - new Date(a?.updated_at).getTime())[0];

  const explicitDraft = mode
    ? {
        id: officialDraft?.id,
        content: mode === "reuse" ? returnedEssaySource?.content ?? "" : "",
        updated_at:
          mode === "reuse"
            ? returnedEssaySource?.updated_at ?? new Date().toISOString()
            : new Date().toISOString(),
        best_essay_consent: false,
      }
    : null;

  const draftData: EssayDraft | null = explicitDraft ?? (latestDraft
    ? {
        id: officialDraft?.id,
        content: latestDraft.content,
        updated_at: latestDraft.updated_at,
        best_essay_consent: officialDraft?.best_essay_consent ?? false,
      }
    : null);

  if (!essayTopic) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500 animate-in fade-in duration-500">
        <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
        <h2 className="text-lg font-bold text-slate-800">Tema não encontrado</h2>
        <p className="text-sm">O ID fornecido é inválido ou o tema foi removido.</p>
      </div>
    );
  }

  return (
    <EssayWorkspace
      essayTopic={essayTopic}
      isSuccess={isSuccess}
      backup={draftData}
      preferInitialBackup={Boolean(mode)}
      hasAvailableCredits={creditSummary.total > 0}
    />
  );
}
