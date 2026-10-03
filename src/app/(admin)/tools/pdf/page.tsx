import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PDF_TEMPLATES } from "@/lib/services/pdf";

export default function PdfToolsPage() {
  return (
    <>
      <PageHeader
        title="PDF tools"
        description="Pre-Inspection PDF templates (2W / 3W / 4W)"
        badge="PI"
      />

      <Card>
        <CardHeader>
          <CardTitle>Pre-Inspection reports</CardTitle>
          <CardDescription>
            Inspection reports for 2W / 3W / 4W, rendered from HTML to PDF.
            Valuation and FI are out of scope.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {PDF_TEMPLATES.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.vehicleType}</Badge>
                  <Badge variant="secondary">
                    GET /api/v2/pdf/{item.vehicleType}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>How to call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Real case:{" "}
            <code className="text-foreground">
              GET /api/v2/pdf/2w?id=&lt;tbl_2wheeler.id&gt;
            </code>{" "}
            or{" "}
            <code className="text-foreground">?jobId=&lt;tbl_jobs.id&gt;</code>
            . Helper:{" "}
            <code className="text-foreground">pdfPathForInspection(kind, id)</code>
            .
          </p>
          <p>
            Sample:{" "}
            <code className="text-foreground">GET /api/v2/pdf/2w?sample=1</code>
            . Preview:{" "}
            <code className="text-foreground">?format=html</code>. Store:{" "}
            <code className="text-foreground">?store=1</code>.
          </p>
          <p>
            Storage: S3_* or{" "}
            <code className="text-foreground">LOCAL_UPLOAD_DIR</code>. Upload
            via{" "}
            <code className="text-foreground">POST /api/v2/files/upload</code>.
          </p>
          <p>Out of scope: valuation PDFs, office/FI print.</p>
        </CardContent>
      </Card>
    </>
  );
}
