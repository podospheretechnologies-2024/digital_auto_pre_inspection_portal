"use client";

import { useEffect } from "react";

import { LinkButton } from "@/components/ui/link-button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
      <h2 className="text-xl font-semibold">This page could not load</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Something went wrong. Try again."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
        <LinkButton href="/dashboard" variant="outline" size="sm">
          Dashboard
        </LinkButton>
      </div>
    </div>
  );
}
