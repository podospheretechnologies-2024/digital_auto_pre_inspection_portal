"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { JobsNav } from "@/components/jobs/jobs-nav";
import { RegPlate } from "@/components/atlas/reg-plate";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <>
      <PageHeader
        title="Pre-Inspection reports"
        description="Global search across QC-approved 2W / 3W / 4W cases"
      />
      <JobsNav active="/jobs/reports" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Filter by customer, vehicle number, or DTI / bank ref
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Customer</Label>
            <Input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Name contains…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle no</Label>
            <Input
              value={vehicleno}
              onChange={(e) => setVehicleno(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>DTI / Ref</Label>
            <Input
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>
          <Button
            onClick={() =>
              setSubmitted({
                customer,
                vehicleno,
                ref_no: refNo,
              })
            }
          >
            Search
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {listQuery.isFetching
              ? "Searching…"
              : `${listQuery.data?.length ?? 0} rows`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listQuery.isError ? (
            <p className="text-sm text-destructive">
              {(listQuery.error as Error).message}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>DTI</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(listQuery.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No matches
                    </TableCell>
                  </TableRow>
                ) : (
                  (listQuery.data ?? []).map((row) => (
                    <TableRow key={`${row.vehicle_type}-${row.id}`}>
                      <TableCell>
                        <Badge variant="outline">{row.vehicle_type}</Badge>
                      </TableCell>
                      <TableCell>{row.dti_no ?? "—"}</TableCell>
                      <TableCell>{row.cname ?? "—"}</TableCell>
                      <TableCell>
                        <RegPlate value={row.vehicleno} />
                        <div className="text-xs text-muted-foreground">
                          {[row.company, row.model].filter(Boolean).join(" / ")}
                        </div>
                      </TableCell>
                      <TableCell>{row.bankname}</TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell>{row.valuation_price ?? "—"}</TableCell>
                      <TableCell className="space-x-2">
                        {row.job_id ? (
                          <LinkButton
                            href={inspectPathForJob(
                              row.job_id,
                              row.vehicle_type,
                              { mode: "view" },
                            )}
                            size="sm"
                            variant="outline"
                          >
                            View
                          </LinkButton>
                        ) : null}
                        <LinkButton
                          href={pdfPathForInspection(row.vehicle_type, row.id)}
                          size="sm"
                          variant="outline"
                        >
                          PDF
                        </LinkButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
