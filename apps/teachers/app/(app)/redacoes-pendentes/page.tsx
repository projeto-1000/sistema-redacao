import { getHolidays, getDeadlineInfo, formatDate } from "@repo/utils";
import { PendingEssaysClient } from "./page-client";
import { getEssaysByStatus } from "@/services/essays";

export default async function PendingEssaysPage() {
  const essays = await getEssaysByStatus({ status: 'pending' });

  const holidays = await getHolidays();

  const formattedEssays = (essays || []).map((essay) => {
    const studentName = (essay.student as unknown as { full_name: string })?.full_name || "Aluno(a)";
    const deadlineInfo = getDeadlineInfo(essay.created_at, holidays);

    const submissionDate = formatDate(essay.created_at, "numeric");

    return {
      id: essay.id,
      student: studentName,
      topic: essay.title,
      submissionDate: submissionDate,
      deadline: deadlineInfo.text,
      status: deadlineInfo.status,
      deadlineLabel: deadlineInfo.label
    };
  });

  return <PendingEssaysClient initialEssays={formattedEssays} />;
}