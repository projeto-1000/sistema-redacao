export interface PendingEssaysFilter {
  search?: string;
  from?: string;
  to?: string;
}

export interface PendingEssayListItem {
  id: string,
  title: string
  created_at: string
  due_date: string
  submission_date: string
  student_name: string
  avatar_url: string
  email?: string
  status?: string
}