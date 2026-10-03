import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

import { zodErrorResponse } from "@/lib/api";
import { isIntegrationConfigError } from "@/lib/integrations/errors";

/** Merge query string + JSON body (body wins). Safe when body is empty/non-JSON. */
export async function readRequestParams(
  request: Request,
): Promise<Record<string, unknown>> {
  const url = new URL(request.url);
  const params: Record<string, unknown> = Object.fromEntries(
    url.searchParams.entries(),
  );

  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const body = await request.json();
      if (body && typeof body === "object" && !Array.isArray(body)) {
        Object.assign(params, body as Record<string, unknown>);
      }
    } catch {
      // empty or non-JSON body — keep query params only
    }
  }

  return params;
}

export function parseWithZod<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, response: zodErrorResponse(parsed.error) };
  }
  return { success: true, data: parsed.data };
}

export function migratedOk(data: unknown, status = 200) {
  return NextResponse.json({ migrated: true, data }, { status });
}

export function integrationErrorResponse(error: unknown) {
  if (isIntegrationConfigError(error)) {
    return NextResponse.json(
      {
        migrated: true,
        message: error.message,
        missing_env: error.envVar,
      },
      { status: 503 },
    );
  }

  console.error(error);
  const message =
    error instanceof Error ? error.message : "External API request failed";
  return NextResponse.json({ migrated: true, message }, { status: 502 });
}
