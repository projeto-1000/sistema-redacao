'use client'

import { StudentProfile } from "@repo/types";

import { updateStudentStatus } from "@/app/actions/students";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import StudentSubscriptionCard from "@/components/student-subscription-card";
import { UserProfileHeader } from "@/components/user-profile-header";

interface StudentsProfileHeaderProps {
  student: StudentProfile
}

export function StudentProfileHeader({ student }: StudentsProfileHeaderProps) {
  const { entity: studentItem, toggleStatus } = useToggleUserStatus(
    student,
    updateStudentStatus
  );

  return (
    <UserProfileHeader
      user={studentItem}
      onToggleStatus={toggleStatus}
      footer={<StudentSubscriptionCard subscription={studentItem.subscription} credits={studentItem.credits} />}
    />
  );
}