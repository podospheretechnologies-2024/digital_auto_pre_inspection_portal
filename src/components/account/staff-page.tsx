"use client";

import { PeopleCrudPage } from "@/components/account/people-crud-page";

export function StaffPage() {
  return (
    <PeopleCrudPage
      title="Staff (HO)"
      description="Head Office staff — create, edit, password, delete"
      apiPath="/api/v2/account/staff"
      queryKey="account-staff"
      roleOptions={["HO"]}
      defaultRole="HO"
      showOnline
      addLabel="Add HO staff"
    />
  );
}
