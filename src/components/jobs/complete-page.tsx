"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Pencil } from "lucide-react";
import { useState } from "react";

import { RegPlate } from "@/components/atlas/reg-plate";
import {
  JobActionLink,
  JobActions,
  JobDtiCell,
  JobMetaLine,
  JobSerialCell,
  JobSerialHead,
  JobsListingCard,
  JobsTable,
  JobsTableCell,
  JobsTableHead,
  JobsTableHeader,
  JobsTableRow,
  TableBody,
} from "@/components/jobs/jobs-listing";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  inspectPathForJob,
  pdfPathForInspection,
  formatDeskDate,
  type WheelKind,
} from "@/lib/jobs/helpers";

type QcRow = {
  id: number;
  job_id: number | null;
  vehicle_type: WheelKind;
  vehicleno: string | null;
  dti_no: string | null;
  cname: string | null;
  bankname: string;
  company: string;
  model: string;
  agent_name: string;
  valuation_price: number | null;
  ownership_name: string | null;
  created_at: string | null;
  qc_datetime?: string | null;
};

export function CompleteCasesPage() {
  const [vehicleType, setVehicleType] = useState("all");

  const listQuery = useQuery({
    queryKey: ["jobs-complete", vehicleType],
    queryFn: async () => {
      const res = await fetch(
        `/api/v2/jobs/qc?done=1&vehicle_type=${vehicleType}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      return (json.data ?? []) as QcRow[];
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Completed"
        description="QC-approved cases. Download or print the pre-inspection PDF."
        eyebrow="Workflow"
        badge="Done"
      />
      <JobsListingCard
        title="Completed inspections"
        description="QC approved cases — view details or download the PDF report"
        count={rows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No completed cases"
        toolbar={
          <select
            className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px]"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="2wheeler">2 Wheeler</option>
            <option value="3wheeler">3 Wheeler</option>
            <option value="4wheeler">4 Wheeler</option>
          </select>
        }
      >
        {rows.length > 0 ? (
          <JobsTable>
            <JobsTableHeader>
              <JobsTableRow>
                <JobSerialHead />
                <JobsTableHead>Type</JobsTableHead>
                <JobsTableHead>DTI</JobsTableHead>
                <JobsTableHead>Customer</JobsTableHead>
                <JobsTableHead>Vehicle</JobsTableHead>
                <JobsTableHead>Price</JobsTableHead>
                <JobsTableHead>Ownership</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Date</JobsTableHead>
                <JobsTableHead className="text-right">Actions</JobsTableHead>
              </JobsTableRow>
            </JobsTableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <JobsTableRow key={`${row.vehicle_type}-${row.id}`}>
                  <JobSerialCell index={index} />
                  <JobsTableCell>
                    <Badge variant="outline" className="font-normal">
                      {row.vehicle_type}
                    </Badge>
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobDtiCell value={row.dti_no} />
                  </JobsTableCell>
                  <JobsTableCell className="font-medium">
                    {row.cname ?? "—"}
                  </JobsTableCell>
                  <JobsTableCell>
                    <RegPlate value={row.vehicleno} />
                    <JobMetaLine>
                      {[row.company, row.model, row.bankname]
                        .filter(Boolean)
                        .join(" · ")}
                    </JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell>{row.valuation_price ?? "—"}</JobsTableCell>
                  <JobsTableCell>{row.ownership_name ?? "—"}</JobsTableCell>
                  <JobsTableCell>{row.agent_name}</JobsTableCell>
                  <JobsTableCell className="tabular-nums text-muted-foreground">
                    {formatDeskDate(row.qc_datetime ?? row.created_at)}
                  </JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      {row.job_id ? (
                        <>
                          <JobActionLink
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "view" },
                            )}
                            tone="outline"
                            icon={Eye}
                            label="View"
                          />
                          <JobActionLink
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "edit" },
                            )}
                            tone="muted"
                            icon={Pencil}
                            label="Edit"
                          />
                        </>
                      ) : null}
                      <JobActionLink
                        href={pdfPathForInspection(row.vehicle_type, row.id)}
                        tone="primary"
                        icon={FileText}
                        label="PDF"
                      />
                    </JobActions>
                  </JobsTableCell>
                </JobsTableRow>
              ))}
            </TableBody>
          </JobsTable>
        ) : null}
      </JobsListingCard>
    </>
  );
}
