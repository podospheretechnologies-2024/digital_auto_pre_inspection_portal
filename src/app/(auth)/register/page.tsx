import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import { auth } from "@/auth";
import { listCities } from "@/lib/masters/service";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const cities = await listCities();
  const options = cities.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#efe6d8_0%,_#faf7f2_45%,_#f5efe6_100%)] p-4">
      <RegisterForm cities={options} />
    </div>
  );
}
