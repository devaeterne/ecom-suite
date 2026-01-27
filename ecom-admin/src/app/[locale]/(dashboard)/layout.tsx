"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import { AppSessionProvider } from "@/src/providers/app-session-provider";
import { useSidebarState } from "@/components/nav/use-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppSessionProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </AppSessionProvider>
    </AuthGuard>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed, toggleCollapsed, mobileOpen, toggleMobile, closeMobile } =
    useSidebarState();

  return (
    <div className="flex h-dvh">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={toggleMobile} />

        <main className="flex-1 overflow-auto bg-ui-bg-subtle p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
