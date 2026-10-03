/** JSON.stringify-safe clone (Prisma BigInt → number/string). */
export function jsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      typeof v === "bigint" ? (v <= Number.MAX_SAFE_INTEGER ? Number(v) : v.toString()) : v,
    ),
  ) as T;
}
