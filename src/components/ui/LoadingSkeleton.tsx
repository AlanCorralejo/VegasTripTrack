"use client";

import React from "react";

export function CardSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm animate-pulse flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="h-6 w-16 rounded bg-muted" />
      </div>
      <div className="h-4 w-3/4 rounded bg-muted mt-1" />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse font-medium">Cargando...</p>
    </div>
  );
}
