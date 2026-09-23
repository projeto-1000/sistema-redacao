'use client'

import { updateTeacherStatus } from "@/app/actions/teachers";
import { useToggleUserStatus } from "@/hooks/use-toggle-user-status";
import { TeacherProfile } from "@repo/types";
import { CreditCard, ChevronRight, ShieldCheck } from "lucide-react";
import { UserProfileHeader } from "./user-profile-header";
import Link from "next/link";
import { useState } from "react";
import { EditTeacherProfileDialog } from "./edit-teacher-profile-dialog";
interface TeacherProfileHeaderProps {
  teacher: TeacherProfile
}

export default function TeacherProfileHeader({ teacher }: TeacherProfileHeaderProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { entity: teacherItem, toggleStatus } = useToggleUserStatus(
    teacher,
    updateTeacherStatus
  );

  return (
    <>
      <UserProfileHeader
        user={teacherItem}
        onEdit={() => setIsEditOpen(true)}
        onToggleStatus={toggleStatus}
        statusBadge={teacherItem.correction_review_required ? (
          <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
            <ShieldCheck className="size-3" />
            Supervisionado
          </span>
        ) : null}
        footer={
          <div className=" bg-slate-100 p-4 px-8">
            <Link
              href={`/professores/${teacher.id}/pagamentos`}
              className="flex items-center justify-between w-full text-sm font-bold hover:text-blue-600 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <CreditCard className="size-4.5 text-slate-400 group-hover:text-blue-600" />
                Gerenciar Pagamentos e Faturas
              </span>

              <ChevronRight className="size-4.5 text-slate-400 group-hover:text-blue-600" />
            </Link>

          </div>
        }
      />
      <EditTeacherProfileDialog
        teacher={teacherItem}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  )
}
