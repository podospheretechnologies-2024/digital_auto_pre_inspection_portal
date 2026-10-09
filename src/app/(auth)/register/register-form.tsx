"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";

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

type CityOption = { id: number; name: string };
type RoOption = { id: number; name: string; city_id: number | null };

export function RegisterForm({
  cities,
  ros,
}: {
  cities: CityOption[];
  ros: RoOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cityId, setCityId] = useState("");
  const [parentId, setParentId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  const rosForCity = useMemo(() => {
    if (!cityId) return ros;
    const cid = Number(cityId);
    return ros.filter((r) => r.city_id == null || r.city_id === cid);
  }, [ros, cityId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      city_id: Number(fd.get("city_id")),
      parent_id: Number(fd.get("parent_id")),
      password: String(fd.get("password") ?? ""),
      password_confirmation: String(fd.get("password_confirmation") ?? ""),
    };

    try {
      const res = await fetch("/api/v2/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.errors) setFieldErrors(json.errors);
        throw new Error(json.message || "Registration failed");
      }
      toast.success(
        json.message ||
          "Registration completed. Wait for HO approval before login.",
      );
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader className="space-y-1">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
          DigitalAuto · Surveyor
        </p>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Self-signup as Surveyor under a verified RO. HO must approve before
          login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" name="first_name" required maxLength={255} />
              {fieldErrors.first_name?.[0] ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.first_name[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" name="last_name" required maxLength={255} />
              {fieldErrors.last_name?.[0] ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.last_name[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            {fieldErrors.email?.[0] ? (
              <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city_id">City</Label>
            <select
              id="city_id"
              name="city_id"
              required
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none"
              value={cityId}
              onChange={(e) => {
                setCityId(e.target.value);
                setParentId("");
              }}
            >
              <option value="" disabled>
                Select city
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.city_id?.[0] ? (
              <p className="text-sm text-destructive">{fieldErrors.city_id[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parent_id">Parent RO</Label>
            <select
              id="parent_id"
              name="parent_id"
              required
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={!cityId}
            >
              <option value="" disabled>
                {cityId ? "Select RO…" : "Select city first"}
              </option>
              {rosForCity.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {cityId && rosForCity.length === 0 ? (
              <p className="text-xs text-amber-700">
                No verified RO for this city. Ask HO to create/approve an RO
                first.
              </p>
            ) : null}
            {fieldErrors.parent_id?.[0] ? (
              <p className="text-sm text-destructive">
                {fieldErrors.parent_id[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Use 8 or more characters.
            </p>
            {fieldErrors.password?.[0] ? (
              <p className="text-sm text-destructive">
                {fieldErrors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {fieldErrors.password_confirmation?.[0] ? (
              <p className="text-sm text-destructive">
                {fieldErrors.password_confirmation[0]}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending || !parentId} className="w-full">
            {pending ? "Submitting…" : "Register"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
