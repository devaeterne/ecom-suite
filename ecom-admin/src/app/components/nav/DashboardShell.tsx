"use client";

import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import { useSidebarState } from "@/components/nav/use-sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed, toggleCollapsed, mobileOpen, toggleMobile, closeMobile } =
    useSidebarState();

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile topbar */}
        <div className="md:hidden flex items-center gap-2 border-b bg-ui-bg-base px-3 py-2">
          <button
            type="button"
            onClick={toggleMobile}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-ui-bg-subtle"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="text-sm font-medium truncate">Admin</div>
        </div>

        <main className="min-w-0 flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
