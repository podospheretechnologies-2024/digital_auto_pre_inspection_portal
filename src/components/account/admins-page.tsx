"use client";

import { PeopleCrudPage } from "@/components/account/people-crud-page";

export function AdminsPage() {
  return (
    <PeopleCrudPage
      title="Admins"
      description="System administrators — create, edit, delete"
      apiPath="/api/v2/account/admins"
      queryKey="account-admins"
      roleOptions={["Admin"]}
      defaultRole="Admin"
      addLabel="Add admin"
    />
  );
}
