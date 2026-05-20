'use client'

import { StudentProfile } from "@repo/types";

import { updateStudentStatus } from "@/app/actions/students";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { UserProfileHeader } from "@/components/user-profile-header";
import { ReactNode } from "react";

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
      onToggleStatus={toggleStatus}
      footer={subscriptionCard}
    />
  );
}