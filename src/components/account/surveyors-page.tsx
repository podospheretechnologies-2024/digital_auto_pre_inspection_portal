"use client";

import { PeopleCrudPage } from "@/components/account/people-crud-page";

export function SurveyorsPage() {
  return (
    <PeopleCrudPage
      title="Surveyors"
      description="RO and Surveyor accounts — create, edit, approve, delete"
      apiPath="/api/v2/account/surveyors"
      queryKey="account-surveyors"
      roleOptions={["RO", "Surveyor"]}
      defaultRole="Surveyor"
      showApprove
      addLabel="Add RO / Surveyor"
    />
  );
}
