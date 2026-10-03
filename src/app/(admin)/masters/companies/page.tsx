import { NameOnlyMasterPage } from "@/components/masters/name-only-master";

export default function CompaniesPage() {
  return (
    <NameOnlyMasterPage
      title="Companies"
      description="Vehicle company master (m_company)"
      endpoint="/api/v2/masters/companies"
      queryKey="masters-companies"
    />
  );
}
