"use client";

import Link from "next/link";
import { useState } from "react";
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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setToken(null);
    try {
      const res = await fetch("/api/v2/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed");
      toast.success(json.message || "If the email exists, a reset was created");
      if (json.reset_token) setToken(String(json.reset_token));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          We will email a reset link when SMTP is configured. Locally you can
          also echo the token with ALLOW_RESET_TOKEN_ECHO.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Request reset"}
          </Button>
          {token ? (
            <p className="break-all rounded-md bg-muted p-2 text-xs">
              Dev token: {token}
              <br />
              <Link
                className="text-primary underline"
                href={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`}
              >
                Continue to reset
              </Link>
            </p>
          ) : null}
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
