import { NameOnlyMasterPage } from "@/components/masters/name-only-master";

export default function CitiesPage() {
  return (
    <NameOnlyMasterPage
      title="Cities"
      description="City master (m_city)"
      endpoint="/api/v2/masters/cities"
      queryKey="masters-cities"
    />
  );
}
