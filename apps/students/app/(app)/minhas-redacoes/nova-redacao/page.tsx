import { redirect } from "next/navigation";
import type { EssayTopicDetail } from "@repo/types";
import { getTopicDetails } from "@/app/actions/get-topics";

import EssayPageClient from "./page-client"; // Novo Client Component
import { AlertCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function NewEssayPage(props: Props) {
  const searchParams = await props.searchParams;
  const topicId = searchParams.id;

  if (!topicId) {
    redirect("/temas");
  }

  const data = await getTopicDetails(topicId);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
        <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
        <h2 className="text-lg font-bold text-slate-800">Tema não encontrado</h2>
        <p className="text-sm">O ID fornecido é inválido ou o tema foi removido.</p>
      </div>
    );
  }

  const essayTopic = data as EssayTopicDetail;

  return <EssayPageClient essayTopic={essayTopic} />;
}
