import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminShell } from "@/components/layout/admin-shell";
import { displayName, roleLabel } from "@/lib/rbac";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AdminShell
      userName={displayName(session.user)}
      roleLabel={roleLabel(session.user)}
      userRole={roleLabel(session.user)}
    >
      {children}
    </AdminShell>
  );
}
