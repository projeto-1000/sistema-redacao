'use client'

import { StudentProfile } from "@repo/types";

import { updateStudentStatus } from "@/app/actions/students";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { UserProfileHeader } from "@/components/user-profile-header";
import { ReactNode } from "react";
import { isStudentCancellationScheduled, SCHEDULED_CANCELLATION_BADGE } from "@/utils/student-subscription-status";

interface StudentsProfileHeaderProps {
  student: StudentProfile
  subscriptionCard: ReactNode
}

export function StudentProfileHeader({ student, subscriptionCard }: StudentsProfileHeaderProps) {
  const { entity: studentItem, toggleStatus } = useToggleUserStatus(
    student,
    updateStudentStatus
  );

  return (
    <UserProfileHeader
      user={studentItem}
      statusDisplay={studentItem.status !== "blocked" && isStudentCancellationScheduled(studentItem.subscription)
        ? { label: SCHEDULED_CANCELLATION_BADGE.label, colors: SCHEDULED_CANCELLATION_BADGE.classes }
        : undefined}
      onToggleStatus={toggleStatus}
      footer={subscriptionCard}
    />
  );
}
