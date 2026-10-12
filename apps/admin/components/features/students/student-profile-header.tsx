'use client'

import { StudentProfile } from "@repo/types";

import { updateStudentStatus } from "@/app/actions/students";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { UserProfileHeader } from "@/components/user-profile-header";
import { ReactNode, useState } from "react";
import { isStudentCancellationScheduled, SCHEDULED_CANCELLATION_BADGE } from "@/utils/student-subscription-status";
import { EditStudentProfileDialog } from "./edit-student-profile-dialog";

interface StudentsProfileHeaderProps {
  student: StudentProfile
  subscriptionCard: ReactNode
}
export function StudentProfileHeader({ student, subscriptionCard }: StudentsProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { entity: studentItem, toggleStatus } = useToggleUserStatus(
    student,
    updateStudentStatus
  );

  return (
    <>
      <UserProfileHeader
        user={studentItem}
        statusDisplay={studentItem.status !== "blocked" && isStudentCancellationScheduled(studentItem.subscription)
          ? { label: SCHEDULED_CANCELLATION_BADGE.label, colors: SCHEDULED_CANCELLATION_BADGE.classes }
          : undefined}
        onEdit={() => setIsEditing(true)}
        onToggleStatus={toggleStatus}
        footer={subscriptionCard}
      />
      <EditStudentProfileDialog
        student={studentItem}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </>
  );
}
