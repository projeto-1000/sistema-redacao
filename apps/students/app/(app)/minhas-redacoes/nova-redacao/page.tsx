import { notFound, redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getTopicDetails } from "@/app/actions/get-topics";
import { getReturnedEssayReuseSource } from "@/app/actions/get-essays";
import { EssayWorkspace } from "@/components/essay-workspace";
import { EssaySubmissionSuccess } from "@/components/essay-submission-success";
import { getDraftEssay, getTemporaryBackup } from "@/app/actions/essay-drafts";
import { getCurrentStudentCreditSummary } from "@/app/actions/credits";
import type { EssayDraft } from "@/types";
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
    searchParams.mode === "reuse" || searchParams.mode === "blank" ? searchParams.mode : undefined;
  const sourceEssayId = searchParams.source;

  if (!topicId) {
    redirect("/temas");
  }
  const isSuccess = searchParams.success === "true";

  const essayTopic = await getTopicDetails(topicId);

  if (!essayTopic) {
    return (
      <div className="animate-in fade-in flex h-[calc(100vh-100px)] flex-col items-center justify-center text-slate-500 duration-500">
        <AlertCircle className="mb-4 h-10 w-10 text-red-400" />
        <h2 className="text-lg font-bold text-slate-800">Tema não encontrado</h2>
        <p className="text-sm">O ID fornecido é inválido ou o tema foi removido.</p>
      </div>
    );
  }

  if (isSuccess) {
    return <EssaySubmissionSuccess topicId={essayTopic.id} topicTitle={essayTopic.title} />;
  }

  const [creditSummary, returnedEssaySource, officialDraft, tempBackup] = await Promise.all([
    getCurrentStudentCreditSummary(),
    mode === "reuse" && sourceEssayId
      ? getReturnedEssayReuseSource(sourceEssayId, topicId)
      : Promise.resolve(null),
    getDraftEssay(topicId),
    mode ? Promise.resolve(null) : getTemporaryBackup(topicId),
  ]);

  if (mode === "reuse" && !returnedEssaySource) {
    notFound();
  }

  const latestDraft = [tempBackup, officialDraft]
    .filter(Boolean)
    .sort((a, b) => new Date(b?.updated_at).getTime() - new Date(a?.updated_at).getTime())[0];

  const explicitDraft = mode
    ? {
        id: officialDraft?.id,
        content: mode === "reuse" ? (returnedEssaySource?.content ?? "") : "",
        updated_at:
          mode === "reuse"
            ? (returnedEssaySource?.updated_at ?? new Date().toISOString())
            : new Date().toISOString(),
        best_essay_consent: false,
      }
    : null;

  const draftData: EssayDraft | null =
    explicitDraft ??
    (latestDraft
      ? {
          id: officialDraft?.id,
          content: latestDraft.content,
          updated_at: latestDraft.updated_at,
          best_essay_consent: officialDraft?.best_essay_consent ?? false,
        }
      : null);

  return (
    <EssayWorkspace
      essayTopic={essayTopic}
      backup={draftData}
      preferInitialBackup={Boolean(mode)}
      hasAvailableCredits={creditSummary.total > 0}
    />
  );
}
