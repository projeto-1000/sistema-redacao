import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getTopicDetails } from "@/app/actions/get-topics";
import { EssayWorkspace } from "@/components/essay-workspace";

type Props = {
  searchParams: Promise<{ id: string, success: string }>;
};

export default async function NewEssayPage(props: Props) {
  const searchParams = await props.searchParams;
  const topicId = searchParams.id;

  if (!topicId) {
    redirect("/temas");
  }
  const isSuccess = searchParams.success === "true";
  const essayTopic = await getTopicDetails(topicId);

  if (!essayTopic) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500 animate-in fade-in duration-500">
        <AlertCircle className="w-10 h-10 mb-4 text-red-400" />
        <h2 className="text-lg font-bold text-slate-800">Tema não encontrado</h2>
        <p className="text-sm">O ID fornecido é inválido ou o tema foi removido.</p>
      </div>
    );
  }

  return <EssayWorkspace essayTopic={essayTopic} isSuccess={isSuccess} />;
}