"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { PresencePing } from "@/components/layout/presence-ping";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AdminShell({
  children,
  userName,
  roleLabel,
  userRole,
}: {
  children: React.ReactNode;
  userName: string;
  roleLabel: string;
  userRole: string;
}) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "228px" } as React.CSSProperties}
    >
      <PresencePing />
      <AppSidebar
        userName={userName}
        roleLabel={roleLabel}
        userRole={userRole}
      />
      {/* min-w-0 lets this flex child shrink below its content width, so a wide
          table scrolls inside its own container instead of pushing the page. */}
      <SidebarInset className="min-w-0">
        <Header />
        <PageContainer>{children}</PageContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
