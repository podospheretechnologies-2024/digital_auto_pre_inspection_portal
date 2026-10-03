/**
 * OUT OF SCOPE — Valuation modules are not part of the Next.js migration.
 * Do not implement DirectValuation / JobValuation / price valuation / valuation QC here.
 * Pre-Inspection lives under lib/services/job-assignment.ts, inspection.ts, qc.ts.
 */

export async function listValuations(): Promise<never> {
  throw new Error(
    "Valuation modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}

export async function getValuationByJobId(_jobId: number): Promise<never> {
  void _jobId;
  throw new Error(
    "Valuation modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}

export async function saveValuation(
  _jobId: number,
  _payload: Record<string, unknown>,
): Promise<never> {
  void _jobId;
  void _payload;
  throw new Error(
    "Valuation modules are out of migration scope. Use Pre-Inspection (/jobs) instead.",
  );
}
