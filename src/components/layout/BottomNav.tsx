"use client";

import React from "react";
import { LayoutDashboard, Receipt, Dices, BarChart3, Map } from "lucide-react";

export type TabType = "dashboard" | "expenses" | "casino" | "statistics" | "map";

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses" as TabType, label: "Gastos", icon: Receipt },
    { id: "casino" as TabType, label: "Casino", icon: Dices },
    { id: "statistics" as TabType, label: "Gráficas", icon: BarChart3 },
    { id: "map" as TabType, label: "Mapa", icon: Map },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/85 backdrop-blur-md pb-safe shadow-lg">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-center transition-all"
            >
              <div
                className={`rounded-full px-5 py-1.5 transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              </div>
              <span
                className={`text-[10px] font-bold mt-1 transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
