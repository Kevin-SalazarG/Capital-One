import { AuthForm } from "@/features/auth/auth-form";
export const metadata = { title: "Crear cuenta" };
export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
