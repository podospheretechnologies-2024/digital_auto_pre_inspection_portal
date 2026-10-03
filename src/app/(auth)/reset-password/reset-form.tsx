"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

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

function ResetFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/v2/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      toast.success("Password updated");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter the token and a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Token</Label>
            <Input
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Update password"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<p className="text-sm">Loading…</p>}>
      <ResetFormInner />
    </Suspense>
  );
}
