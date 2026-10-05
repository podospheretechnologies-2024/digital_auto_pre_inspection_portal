"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Search } from "lucide-react";
import { useState } from "react";

import { RegPlate } from "@/components/atlas/reg-plate";
import {
  JobActionButton,
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
import { JobsNav } from "@/components/jobs/jobs-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inspectPathForJob,
  pdfPathForInspection,
  type WheelKind,
} from "@/lib/jobs/helpers";

type ReportRow = {
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
  created_at: string | null;
};

export function ReportsPage() {
  const [customer, setCustomer] = useState("");
  const [vehicleno, setVehicleno] = useState("");
  const [refNo, setRefNo] = useState("");
  const [submitted, setSubmitted] = useState({
    customer: "",
    vehicleno: "",
    ref_no: "",
  });

  const listQuery = useQuery({
    queryKey: ["jobs-reports", submitted],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (submitted.customer) params.set("customer", submitted.customer);
      if (submitted.vehicleno) params.set("vehicleno", submitted.vehicleno);
      if (submitted.ref_no) params.set("ref_no", submitted.ref_no);
      const res = await fetch(`/api/v2/jobs/reports?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      return (json.data ?? []) as ReportRow[];
    },
  });

  const rows = listQuery.data ?? [];

  return (
    <>
      <PageHeader
        title="Data export"
        description="Search QC-approved 2W / 3W / 4W cases and export report data."
        eyebrow="Manage"
      />
      <JobsNav active="/jobs/reports" />

      <JobsListingCard
        className="mb-4"
        title="Search filters"
        description="Filter by customer, vehicle number, or DTI / bank ref"
        toolbar={
          <JobActionButton
            tone="primary"
            icon={Search}
            label="Search"
            onClick={() =>
              setSubmitted({
                customer,
                vehicleno,
                ref_no: refNo,
              })
            }
          />
        }
      >
        <div className="flex flex-wrap items-end gap-3 px-4 py-3">
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Customer</Label>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Name contains…"
              className="h-8 text-[13px]"
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Vehicle no
            </Label>
            <Input
              value={vehicleno}
              onChange={(e) => setVehicleno(e.target.value)}
              className="h-8 text-[13px]"
            />
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">DTI / Ref</Label>
            <Input
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              className="h-8 text-[13px]"
            />
          </div>
        </div>
      </JobsListingCard>

      <JobsListingCard
        title="Results"
        description={
          listQuery.isFetching ? "Searching…" : `${rows.length} matching rows`
        }
        count={listQuery.isFetching ? undefined : rows.length}
        loading={listQuery.isLoading}
        error={
          listQuery.isError ? (listQuery.error as Error).message : null
        }
        empty="No matching reports"
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
                <JobsTableHead>Bank</JobsTableHead>
                <JobsTableHead>Agent</JobsTableHead>
                <JobsTableHead>Price</JobsTableHead>
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
                      {[row.company, row.model].filter(Boolean).join(" / ")}
                    </JobMetaLine>
                  </JobsTableCell>
                  <JobsTableCell>
                    <div
                      className="max-w-[140px] truncate"
                      title={row.bankname}
                    >
                      {row.bankname}
                    </div>
                  </JobsTableCell>
                  <JobsTableCell>{row.agent_name}</JobsTableCell>
                  <JobsTableCell>{row.valuation_price ?? "—"}</JobsTableCell>
                  <JobsTableCell>
                    <JobActions>
                      {row.job_id ? (
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
