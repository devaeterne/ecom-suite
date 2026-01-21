"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type Status = "draft" | "published" | "archived";

type DraftState = {
  draftId: string | null;
  setDraftId: (id: string | null) => void;

  title: string;
  setTitle: (v: string) => void;

  handle: string;
  setHandle: (v: string) => void;

  // handle auto-fill kontrolü
  handleTouched: boolean;
  setHandleTouched: (v: boolean) => void;

  status: Status;
  setStatus: (v: Status) => void;

  description: string;
  setDescription: (v: string) => void;

  categoryIds: string[];
  setCategoryIds: (v: string[]) => void;

  collectionIds: string[];
  setCollectionIds: (v: string[]) => void;

  // ✅ tags
  tagIds: string[];
  setTagIds: (v: string[]) => void;

  titleOk: boolean;
  handleOk: boolean;
  canDraft: boolean;

  draftBody: {
    title: string;
    handle: string;
    status: Status;
    description: string | null;
    categoryIds: string[];
    collectionIds: string[];
    tagIds: string[];
  };
};

const Ctx = createContext<DraftState | null>(null);

export function slugify(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // diacritics
    .replace(/[^a-z0-9\s-]/g, "") // keep alnum, space, dash
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductNewDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draftId, setDraftId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);

  const [status, setStatus] = useState<Status>("draft");
  const [description, setDescription] = useState("");

  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  const titleOk = title.trim().length >= 2;
  const handleOk = handle.trim().length >= 2;
  const canDraft = titleOk && handleOk;

  const draftBody = useMemo(
    () => ({
      title: title.trim(),
      handle: handle.trim(),
      status,
      description: description?.trim() ? description : null,
      categoryIds,
      collectionIds,
      tagIds,
    }),
    [title, handle, status, description, categoryIds, collectionIds, tagIds],
  );

  const value: DraftState = {
    draftId,
    setDraftId,
    title,
    setTitle,
    handle,
    setHandle,
    handleTouched,
    setHandleTouched,
    status,
    setStatus,
    description,
    setDescription,
    categoryIds,
    setCategoryIds,
    collectionIds,
    setCollectionIds,
    tagIds,
    setTagIds,
    titleOk,
    handleOk,
    canDraft,
    draftBody,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProductNewDraft() {
  const v = useContext(Ctx);
  if (!v)
    throw new Error(
      "useProductNewDraft must be used inside ProductNewDraftProvider",
    );
  return v;
}
