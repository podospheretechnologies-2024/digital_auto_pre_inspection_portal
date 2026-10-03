import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/(auth)/login/login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#efe6d8_0%,_#faf7f2_45%,_#f5efe6_100%)] p-4">
      <LoginForm />
    </div>
  );
}
