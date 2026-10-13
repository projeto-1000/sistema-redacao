export const STUDENTS_LOGIN_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://app.projeto1000.com.br/login"
    : "https://students-dev.vercel.app/login";
