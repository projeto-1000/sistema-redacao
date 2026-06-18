import { getTopicDetails } from "@/app/actions/topics";
import EditTopic from "@/components/edit-topic";
import { notFound } from "next/navigation";

interface EditTopicPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const resolvedParams = await params;
  const topicId = resolvedParams.id;

  const topicData = await getTopicDetails(topicId);

  if (!topicData) {
    notFound();
  }

  return <EditTopic initialData={topicData} />;
}