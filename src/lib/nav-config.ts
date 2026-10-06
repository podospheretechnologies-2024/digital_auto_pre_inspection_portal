import type { ComponentType } from "react";
import {
  Ban,
  Building2,
  CheckCircle2,
  CirclePause,
  ClipboardCheck,
  ClipboardPlus,
  CloudDownload,
  // FileCheck2, // QC Audit (commented out)
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  /** Show trailing chevron (Manage section style) */
  chevron?: boolean;
  /** Exact match only (avoid /jobs matching everything) */
  exact?: boolean;
  /**
   * Who can see this item in the sidebar.
   * omit / "all" = every logged-in user
   * "admin" | "both" (Admin+HO) | "adminHoBank" | "adminOnly"
   */
  access?: "all" | "admin" | "both" | "adminHoBank" | "adminOnly";
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

/**
 * Pre-Inspection sidebar — matches ops WORKFLOW / MANAGE layout.
 */
export const adminNavGroups: NavGroup[] = [
  {
    label: null,
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Workflow",
    items: [
      {
        title: "Create Intimation",
        href: "/jobs/assign",
        icon: ClipboardPlus,
      },
      {
        title: "Fresh Case",
        href: "/jobs/fresh",
        icon: Zap,
      },
      {
        title: "Assign Case",
        href: "/jobs/schedule",
        icon: UserPlus,
      },
      {
        title: "Quality Check",
        href: "/jobs/qc",
        icon: ShieldCheck,
      },
      // QC Audit — not needed for now (route /jobs/reports still exists for Data Export)
      // {
      //   title: "QC Audit",
      //   href: "/jobs/reports",
      //   icon: FileCheck2,
      // },
      {
        title: "Hold",
        href: "/jobs/hold",
        icon: CirclePause,
      },
      {
        title: "Completed",
        href: "/jobs/complete",
        icon: CheckCircle2,
      },
      {
        title: "Cancel",
        href: "/jobs/cancel",
        icon: Ban,
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        title: "Surveyor List",
        href: "/account/surveyors",
        icon: MapPin,
        chevron: true,
        access: "both",
      },
      {
        title: "HO Staff",
        href: "/account/staff",
        icon: Users,
        chevron: true,
        access: "adminOnly",
      },
      {
        title: "Admins",
        href: "/account/admins",
        icon: ShieldCheck,
        chevron: true,
        access: "adminOnly",
      },
      {
        title: "Bank User List",
        href: "/account/bank-users",
        icon: Building2,
        chevron: true,
        access: "both",
      },
      {
        title: "Staff permissions",
        href: "/account/staff-permissions",
        icon: ClipboardCheck,
        chevron: true,
        access: "adminOnly",
      },
      {
        title: "Masters",
        href: "/masters",
        icon: LayoutGrid,
        chevron: true,
        access: "both",
      },
      {
        title: "Account",
        href: "/account/settings",
        icon: Settings,
        chevron: true,
        access: "all",
      },
      {
        title: "Data Export",
        href: "/jobs/reports",
        icon: CloudDownload,
        chevron: true,
        access: "adminHoBank",
      },
    ],
  },
];

/** Masters hub cards */
export const mastersLinks = [
  { title: "Banks", href: "/masters/banks", icon: Building2 },
  { title: "Brokers", href: "/masters/brokers", icon: Building2 },
  { title: "Cities", href: "/masters/cities", icon: MapPin },
  { title: "Companies", href: "/masters/companies", icon: LayoutGrid },
  { title: "Models", href: "/masters/models", icon: LayoutGrid },
  { title: "Variants", href: "/masters/variants", icon: LayoutGrid },
  {
    title: "Staff permissions",
    href: "/account/staff-permissions",
    icon: ClipboardCheck,
  },
] as const;

export { ChevronRight };
