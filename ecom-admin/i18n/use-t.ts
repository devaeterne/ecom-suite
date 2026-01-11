"use client";

import { useI18n } from "@/i18n/i18n-provider";

function get(obj: any, path: string) {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export function useT() {
  const { messages } = useI18n();
  return (key: string) => {
    const v = get(messages, key);
    return typeof v === "string" ? v : key; // fallback: key
  };
}
