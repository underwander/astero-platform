import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация | Astero",
  description: "Регистрация личного кабинета Astero",
};

export default function SignUp() {
  return <SignUpForm />;
}
