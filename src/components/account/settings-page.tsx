"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  type: string;
  role: string;
  isAdmin: boolean;
  bankId: number | null;
  cityId: number | null;
  info: {
    phone: string | null;
    company: string | null;
    website: string | null;
    country: string | null;
    language: string | null;
    timezone: string | null;
    currency: string | null;
    marketing: number | null;
  };
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const firstError =
      json.errors &&
      Object.values(json.errors as Record<string, string[]>)
        .flat()
        .find(Boolean);
    throw new Error(firstError || json.message || "Request failed");
  }
  return json as T;
}

export function AccountSettingsPage() {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");

  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmProfile, setConfirmProfile] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["account-settings"],
    queryFn: async () => {
      const json = await apiJson<{ data: Profile }>("/api/v2/account/settings");
      return json.data;
    },
  });

  useEffect(() => {
    const p = profileQuery.data;
    if (!p) return;
    queueMicrotask(() => {
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setPhone(p.info?.phone ?? "");
      setCompany(p.info?.company ?? "");
      setWebsite(p.info?.website ?? "");
      setCountry(p.info?.country ?? "");
      setEmail(p.email);
    });
  }, [profileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: async () =>
      apiJson("/api/v2/account/settings", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          company: company || null,
          website: website || null,
          country: country || null,
        }),
      }),
    onSuccess: async () => {
      toast.success("Profile updated");
      await queryClient.invalidateQueries({ queryKey: ["account-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const emailMutation = useMutation({
    mutationFn: async () =>
      apiJson("/api/v2/account/settings/email", {
        method: "PUT",
        body: JSON.stringify({
          email,
          current_password: emailPassword,
        }),
      }),
    onSuccess: () => {
      toast.success("Email updated — sign in again with the new address");
      setEmailPassword("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () =>
      apiJson("/api/v2/account/settings", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          password,
          password_confirmation: confirm,
        }),
      }),
    onSuccess: () => {
      toast.success("Password updated");
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const profile = profileQuery.data;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Account profile, email and password"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Name and contact details stored on users / user_infos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profileQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : profileQuery.isError ? (
              <p className="text-sm text-destructive">
                {(profileQuery.error as Error).message}
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
                {profile ? (
                  <p className="text-xs text-muted-foreground">
                    Role: {profile.role}
                    {profile.bankId != null
                      ? ` · Bank ID ${profile.bankId}`
                      : ""}
                  </p>
                ) : null}
                <Button
                  disabled={
                    !firstName.trim() ||
                    !lastName.trim() ||
                    profileMutation.isPending
                  }
                  onClick={() => setConfirmProfile(true)}
                >
                  {profileMutation.isPending ? "Saving…" : "Save profile"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Change email</CardTitle>
              <CardDescription>
                Requires current password. Demo account blocked.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email_password">Current password</Label>
                <Input
                  id="email_password"
                  type="password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
              </div>
              <Button
                disabled={
                  !email.trim() ||
                  !emailPassword ||
                  emailMutation.isPending
                }
                onClick={() => emailMutation.mutate()}
              >
                {emailMutation.isPending ? "Updating…" : "Update email"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>
                Requires current password. Validated with Zod (min 8 chars).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current_password">Current password</Label>
                <Input
                  id="current_password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation">Confirm password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button
                disabled={
                  !currentPassword ||
                  !password ||
                  !confirm ||
                  passwordMutation.isPending
                }
                onClick={() => passwordMutation.mutate()}
              >
                {passwordMutation.isPending ? "Updating…" : "Update password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmProfile}
        onOpenChange={setConfirmProfile}
        title="Save profile?"
        description="Your profile will be saved after you confirm."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={profileMutation.isPending}
        onConfirm={() => {
          setConfirmProfile(false);
          profileMutation.mutate();
        }}
      />
    </>
  );
}
