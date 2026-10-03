"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/app/(auth)/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { adminNavGroups, ChevronRight } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  userName: string;
  roleLabel: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function isItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  if (exact || href === "/dashboard") {
    return pathname === href;
  }
  if (href === "/masters") {
    return pathname === "/masters" || pathname.startsWith("/masters/");
  }
  if (href === "/jobs/reports") {
    return pathname === "/jobs/reports";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ userName, roleLabel }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-5 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="hover:bg-transparent active:bg-transparent"
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold tracking-tight">DA</span>
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-lg font-bold text-sidebar-foreground">
                  DigitalAuto
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Pre-Inspection
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden px-4">
        {adminNavGroups.map((group, gi) => (
          <SidebarGroup key={group.label ?? `top-${gi}`} className="px-0 py-1">
            {group.label ? (
              <SidebarGroupLabel className="h-auto px-3 pt-4 pb-1 text-xs leading-[21px] font-bold text-sidebar-foreground uppercase">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href, item.exact);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={`${item.href}-${item.title}`}>
                    <SidebarMenuButton
                      render={<Link href={item.href} aria-label={item.title} />}
                      tooltip={item.title}
                      isActive={active}
                      className={cn(
                        "h-11 gap-3 rounded-md px-3 text-[15px] font-medium text-sidebar-foreground transition-colors",
                        "hover:bg-lightprimary hover:text-primary",
                        "data-active:bg-primary data-active:text-primary-foreground data-active:shadow-[0_4px_12px_-4px] data-active:shadow-primary/60",
                        "data-active:hover:bg-primary data-active:hover:text-primary-foreground",
                      )}
                    >
                      <Icon className="size-5! shrink-0 group-data-[collapsible=icon]:size-4!" />
                      <span className="truncate">{item.title}</span>
                      {item.chevron ? (
                        <ChevronRight className="ml-auto size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="rounded-lg bg-lightsecondary hover:bg-lightprimary data-popup-open:bg-lightprimary"
                  />
                }
              >
                <Avatar className="size-9 rounded-full">
                  <AvatarFallback className="rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56 rounded-md"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="grid text-sm leading-tight">
                      <span className="truncate font-medium">{userName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {roleLabel}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/account/settings" />}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void logoutAction();
                  }}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
