import { NameOnlyMasterPage } from "@/components/masters/name-only-master";

export default function BrokersPage() {
  return (
    <NameOnlyMasterPage
      title="Brokers"
      description="Insurer / broker master (m_broker)"
      endpoint="/api/v2/masters/brokers"
      queryKey="masters-brokers"
    />
  );
}
