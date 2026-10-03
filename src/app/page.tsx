import { LinkButton } from "@/components/ui/link-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">DigitalAuto Next</CardTitle>
          <CardDescription>
            Full-stack migration — Phase 1 auth is live in this app folder.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          {session?.user ? (
            <LinkButton href="/dashboard">Open dashboard</LinkButton>
          ) : (
            <LinkButton href="/login">Sign in</LinkButton>
          )}
          <LinkButton href="/api/health" target="_blank" variant="secondary">
            API health
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  );
}
