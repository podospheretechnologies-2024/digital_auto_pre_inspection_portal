import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import { auth } from "@/auth";
import { getPersonLookups } from "@/lib/account/staff";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const lookups = await getPersonLookups();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#efe6d8_0%,_#faf7f2_45%,_#f5efe6_100%)] p-4">
      <RegisterForm cities={lookups.cities} ros={lookups.ros} />
    </div>
  );
}
