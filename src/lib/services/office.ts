/**
 * OUT OF SCOPE — FI / Office modules are not part of the Next.js migration.
 * Do not implement OfficeController / tbl_jobs_office / tbl_office flows here.
 * Pre-Inspection lives under lib/services/job-assignment.ts, inspection.ts, qc.ts.
 */

export async function listOfficeJobs(): Promise<never> {
  throw new Error(
    "FI / Office modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}

export async function getOfficeJobById(_jobId: number): Promise<never> {
  void _jobId;
  throw new Error(
    "FI / Office modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}

export async function updateOfficeJob(
  _jobId: number,
  _payload: Record<string, unknown>,
): Promise<never> {
  void _jobId;
  void _payload;
  throw new Error(
    "FI / Office modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}
