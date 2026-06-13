"use client";

import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_META = {
  danger: {
    icon: "🗑️",
    confirmClass:
      "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]",
    headerBg: "bg-rose-500/10 border-rose-400/30",
    titleColor: "text-rose-700 dark:text-rose-400",
  },
  warning: {
    icon: "📁",
    confirmClass:
      "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]",
    headerBg: "bg-amber-500/10 border-amber-400/30",
    titleColor: "text-amber-700 dark:text-amber-400",
  },
  default: {
    icon: "❓",
    confirmClass:
      "bg-primary text-primary-foreground border-primary hover:opacity-90 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]",
    headerBg: "bg-primary/10 border-primary/30",
    titleColor: "text-foreground",
  },
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const meta = VARIANT_META[variant];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm border-2 border-border bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b-2 border-border ${meta.headerBg}`}>
          <span className="text-2xl">{meta.icon}</span>
          <h3 className={`font-mono font-extrabold text-sm uppercase tracking-tight ${meta.titleColor}`}>
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed font-mono whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            autoFocus
            className="flex-1 px-4 py-2.5 border-2 border-border font-bold text-xs uppercase font-mono bg-background text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 border-2 font-bold text-xs uppercase font-mono hover:-translate-y-[1px] transition-all ${meta.confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook: useConfirm ────────────────────────────────────────────────────────
// Usage:
//   const { confirmModal, openConfirm } = useConfirm();
//   await openConfirm({ title, message, variant }) — resolves true/false
//   Place <>{confirmModal}</> in JSX.

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    opts: ConfirmOptions;
    resolve: ((v: boolean) => void) | null;
  }>({
    isOpen: false,
    opts: { title: "", message: "" },
    resolve: null,
  });

  const openConfirm = React.useCallback(
    (opts: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({ isOpen: true, opts, resolve });
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState(s => ({ ...s, isOpen: false, resolve: null }));
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, isOpen: false, resolve: null }));
  }, [state]);

  const confirmModal = (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.opts.title}
      message={state.opts.message}
      confirmLabel={state.opts.confirmLabel}
      cancelLabel={state.opts.cancelLabel}
      variant={state.opts.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirmModal, openConfirm };
}
