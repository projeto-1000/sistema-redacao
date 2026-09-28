import { StudentLoginPage } from "@/components/student-login-page";

const SIGNUP_URL =
  process.env.VERCEL_ENV === "production"
    ? "https://www.projeto1000.com.br/cadastro"
    : "https://projeto1000-dev.vercel.app/cadastro";

export default function LoginPage() {
  return <StudentLoginPage signupHref={SIGNUP_URL} />;
}
