import type { QueryClient } from "@tanstack/react-query";

const SHEET_KEYS = [
  ["jobs"],
  ["jobs-qc"],
  ["jobs-complete"],
  ["jobs-hold"],
  ["jobs-cancel"],
  ["jobs-reports"],
  ["job-stage-counts"],
] as const;

/** Refetch every case sheet after a case moves to another section. */
export function refreshJobSheets(queryClient: QueryClient) {
  return Promise.all(
    SHEET_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey: [...queryKey] }),
    ),
  );
}
