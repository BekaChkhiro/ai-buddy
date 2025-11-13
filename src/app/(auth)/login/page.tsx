/**
 * Login page
 */

import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
