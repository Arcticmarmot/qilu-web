"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cx } from "@/lib/cx";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_EVENT = "qilu:toast";

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined" || !message) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message, type },
    }),
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastType = "success") => {
    if (!message) {
      return;
    }

    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message, type }]);
    window.setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; type?: ToastType }>).detail;
      notify(detail?.message || "", detail?.type || "success");
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, [notify]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-0 right-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cx(
              "pointer-events-auto max-w-[calc(100vw-2rem)] rounded-md border px-4 py-3 text-sm leading-6 shadow-subtle backdrop-blur",
              toast.type === "error"
                ? "border-danger/35 bg-danger/15 text-danger"
                : "border-accent/40 bg-soft/95 text-accent-strong",
            )}
            role={toast.type === "error" ? "alert" : "status"}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context.notify;
}

export function useToastMessage(message: string, type: ToastType = "error") {
  const notify = useToast();

  useEffect(() => {
    if (message) {
      notify(message, type);
    }
  }, [message, notify, type]);
}
