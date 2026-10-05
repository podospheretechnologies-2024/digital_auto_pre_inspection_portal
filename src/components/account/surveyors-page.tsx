"use client";

import { PeopleCrudPage } from "@/components/account/people-crud-page";

export function SurveyorsPage() {
  return (
    <PeopleCrudPage
      title="Surveyors"
      description="Create RO first, then Surveyor linked to that RO. Approve before login. Case assign uses RO → linked Surveyors only."
      apiPath="/api/v2/account/surveyors"
      queryKey="account-surveyors"
      roleOptions={["RO", "Surveyor"]}
      defaultRole="RO"
      showApprove
      addLabel="Add RO / Surveyor"
    />
  );
}
