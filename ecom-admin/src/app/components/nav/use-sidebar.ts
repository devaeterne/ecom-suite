"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const LS_COLLAPSED = "admin.sidebar.collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  const v = window.localStorage.getItem(LS_COLLAPSED);
  return v === "1" || v === "true";
}

function writeCollapsed(next: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_COLLAPSED, next ? "1" : "0");
}

export type SidebarState = {
  collapsed: boolean;
  toggleCollapsed: () => void;

  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  openMobile: () => void;
};

export function useSidebarState(): SidebarState {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // hydrate collapsed from localStorage (client only)
  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((p) => !p);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  return useMemo(
    () => ({
      collapsed,
      toggleCollapsed,
      mobileOpen,
      toggleMobile,
      closeMobile,
      openMobile,
    }),
    [
      collapsed,
      toggleCollapsed,
      mobileOpen,
      toggleMobile,
      closeMobile,
      openMobile,
    ],
  );
}

// ✅ Import karmaşası olmasın diye default da veriyorum
export default useSidebarState;
