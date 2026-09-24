import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata = {
  title: "Dashboard - SSEP Payroll",
  description: "Executive payroll and attendance management dashboard",
};

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
