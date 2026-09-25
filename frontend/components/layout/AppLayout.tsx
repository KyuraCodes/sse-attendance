"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { CircleNotch } from "@phosphor-icons/react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading skeleton while verifying session
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <CircleNotch size={32} weight="bold" className="animate-spin text-emerald-600 mb-3" />
        <p className="text-xs font-medium tracking-wide">Loading SSE Payroll...</p>
      </div>
    );
  }

  // If unauthenticated and not loading, render null while redirection takes effect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col w-full min-w-0 overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by 260px on desktop) */}
      <div className="lg:pl-[260px] flex flex-col flex-1 min-h-[100dvh] w-full min-w-0 overflow-x-hidden transition-all">
        {/* Top Header */}
        <Header
          title={title}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0 mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
