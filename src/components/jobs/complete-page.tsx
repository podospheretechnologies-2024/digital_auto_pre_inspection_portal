"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { WorkflowStrip } from "@/components/jobs/workflow-strip";
import { RegPlate } from "@/components/atlas/reg-plate";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <>
      <PageHeader
        title="Completed"
        description="status: completed — print / download PDF"
      />
      <WorkflowStrip active="completed" />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Completed inspections</CardTitle>
            <CardDescription>
              QC approved inspections — open a case to view or download its PDF report
            </CardDescription>
          </div>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="2wheeler">2 Wheeler</option>
            <option value="3wheeler">3 Wheeler</option>
            <option value="4wheeler">4 Wheeler</option>
          </select>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : listQuery.isError ? (
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
                  <TableHead>Price</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Agent</TableHead>
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
                      No complete cases
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
                          {[row.company, row.model, row.bankname]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </TableCell>
                      <TableCell>{row.valuation_price ?? "—"}</TableCell>
                      <TableCell>{row.ownership_name ?? "—"}</TableCell>
                      <TableCell>{row.agent_name}</TableCell>
                      <TableCell className="space-x-2">
                        {row.job_id ? (
                          <>
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
                            <LinkButton
                              href={inspectPathForJob(
                                row.job_id,
                                row.vehicle_type,
                                { mode: "edit" },
                              )}
                              size="sm"
                              variant="outline"
                            >
                              Edit
                            </LinkButton>
                          </>
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
