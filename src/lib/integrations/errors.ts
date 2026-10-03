/** Thrown when a required external integration env var is missing. */
export class IntegrationConfigError extends Error {
  readonly envVar: string;
  readonly status = 503 as const;

  constructor(envVar: string) {
    super(
      `External integration is not configured. Set ${envVar} in the environment.`,
    );
    this.name = "IntegrationConfigError";
    this.envVar = envVar;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new IntegrationConfigError(name);
  }
  return value;
}

export function isIntegrationConfigError(
  error: unknown,
): error is IntegrationConfigError {
  return error instanceof IntegrationConfigError;
}
