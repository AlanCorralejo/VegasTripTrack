"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastType = "default" | "success" | "destructive";

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (description: string, options?: { title?: string; type?: ToastType; duration?: number }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (description: string, options?: { title?: string; type?: ToastType; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = {
        id,
        description,
        title: options?.title,
        type: options?.type || "default",
      };

      setToasts((prev) => [...prev, newToast]);

      const duration = options?.duration || 3000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-55 flex flex-col items-center justify-end px-4 pointer-events-none gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                {t.type === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
                {t.type === "destructive" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {t.type === "default" && (
                  <Info className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 grid gap-1">
                {t.title && (
                  <h4 className="font-semibold text-sm leading-none text-foreground">
                    {t.title}
                  </h4>
                )}
                <p className="text-sm text-muted-foreground leading-normal">
                  {t.description}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
