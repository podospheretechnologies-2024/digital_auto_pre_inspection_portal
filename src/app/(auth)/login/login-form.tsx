"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
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

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md border-border/80 shadow-md">
      <CardHeader className="space-y-1">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
          DigitalAuto · Internal
        </p>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Use your DigitalAuto account credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            {state.fieldErrors?.email?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            {state.fieldErrors?.password?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>

          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <a href="/forgot-password" className="text-primary underline">
              Forgot password?
            </a>
            {" · "}
            <a href="/register" className="text-primary underline">
              Register as surveyor
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
