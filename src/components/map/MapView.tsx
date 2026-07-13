"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import MapContainer with SSR disabled because Leaflet uses browser 'window' global
const MapContainer = dynamic(
  () => import("./MapContainer").then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col h-[50vh] w-full items-center justify-center bg-card rounded-3xl border border-border gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-semibold">Cargando mapa interactivo...</p>
      </div>
    ),
  }
);

export function MapView() {
  return <MapContainer />;
}
