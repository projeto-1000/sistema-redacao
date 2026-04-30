
import { StudentProfile } from "@repo/types";
import StudentSubscriptionCard from "./student-subscription-card";
import { UserProfileHeader } from "./user-profile-header";
import { updateStudentStatus } from "@/app/actions/students";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";

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
      footer={<StudentSubscriptionCard subscription={studentItem.subscription} />}
    />
  );
}