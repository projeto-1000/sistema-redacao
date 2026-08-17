const studentsAppUrl = process.env.NEXT_PUBLIC_STUDENTS_APP_URL;

export const SUPPORT_URL = "mailto:contato@projeto1000.com.br";

export function getStudentsUrl(path: string) {
  if (!studentsAppUrl) return null;

  try {
    return new URL(path, `${studentsAppUrl.replace(/\/$/, "")}/`).toString();
  } catch {
    return null;
  }
}
