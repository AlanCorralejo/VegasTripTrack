"use client";

import React from "react";
import { Expense, CasinoSession } from "@/services/db";
import { getCategoryDetails, CATEGORIES } from "@/utils/categories";
import { formatUSD, getTodayDateString, isDateInThisWeek } from "@/utils/date";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, Award, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface DashboardViewProps {
  expenses: Expense[];
  casinoSessions: CasinoSession[];
  setActiveTab: (tab: "dashboard" | "expenses" | "casino" | "statistics") => void;
}

export function DashboardView({ expenses, casinoSessions, setActiveTab }: DashboardViewProps) {
  const todayStr = getTodayDateString();

  // Calculations
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCasinoProfit = casinoSessions.reduce((sum, s) => sum + s.profit, 0);
  const tripBalance = totalCasinoProfit - totalExpenses;

  const todayExpenses = expenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const weekExpenses = expenses
    .filter((e) => isDateInThisWeek(e.date))
    .reduce((sum, e) => sum + e.amount, 0);

  // Category statistics
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  let biggestCategory = "Ninguno";
  let biggestAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > biggestAmount) {
      biggestAmount = amt;
      biggestCategory = getCategoryDetails(cat).label;
    }
  });

  // Recent Activity Merge
  interface ActivityItem {
    id: string;
    type: "expense" | "casino";
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    isProfit?: boolean;
    category?: string;
  }

  const activities: ActivityItem[] = [
    ...expenses.map((e) => ({
      id: e.id,
      type: "expense" as const,
      title: getCategoryDetails(e.category).label,
      subtitle: e.notes || "Gasto sin nota",
      amount: e.amount,
      date: e.date,
      category: e.category,
    })),
    ...casinoSessions.map((s) => ({
      id: s.id,
      type: "casino" as const,
      title: s.casinoName,
      subtitle: `Buy In: ${formatUSD(s.buyIn)} | Cash Out: ${formatUSD(s.cashOut)}`,
      amount: s.profit,
      date: s.date,
      isProfit: s.profit >= 0,
    })),
  ];

  const recentActivities = activities
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Trip Balance Hero Card */}
      <div className={`${tripBalance >= 0 ? "border-emerald-500" : "border-rose-500"} rounded-3xl p-6 bg-card border border-border shadow-sm transition-all flex flex-col gap-4`}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Balance General del Viaje</span>
            <h2 className={`text-4xl font-extrabold mt-1 tracking-tight ${tripBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}>
              {formatUSD(tripBalance)}
            </h2>
          </div>
          <span className="text-xs bg-secondary px-2.5 py-1 rounded-full font-medium text-muted-foreground">Las Vegas 🇺🇸</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${tripBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}>
          {tripBalance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{tripBalance >= 0 ? "Ganancia Neta" : "Déficit Neto"}</span>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Gastos Totales</span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-foreground truncate">{formatUSD(totalExpenses)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Casino Neto</span>
            <div className={`rounded-lg p-1.5 ${totalCasinoProfit >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}>
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className={`text-xl font-bold truncate ${totalCasinoProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {totalCasinoProfit >= 0 ? "+" : ""}{formatUSD(totalCasinoProfit)}
          </p>
        </div>
      </div>

      {/* Sub-metrics Carousel/Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary/50 p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hoy</span>
          <span className="text-sm font-extrabold text-foreground truncate">{formatUSD(todayExpenses)}</span>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Esta Semana</span>
          <span className="text-sm font-extrabold text-foreground truncate">{formatUSD(weekExpenses)}</span>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Categoría</span>
          <span className="text-xs font-extrabold text-primary truncate leading-tight mt-0.5" title={biggestCategory}>
            {biggestCategory}
          </span>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-primary" />
            Gastos por Categoría
          </h3>
          <button
            onClick={() => setActiveTab("expenses")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Ver todos
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-4">
          {expenses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-2">No hay gastos registrados aún.</p>
          ) : (
            CATEGORIES.map((cat) => {
              const amount = categoryTotals[cat.id] || 0;
              if (amount === 0) return null;
              const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
              const Icon = cat.icon;

              return (
                <div key={cat.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg ${cat.color} p-1.5 text-white`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-foreground">{cat.label}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatUSD(amount)} <span className="text-[10px] text-muted-foreground font-medium">({percentage.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-primary" />
            Actividad Reciente
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {recentActivities.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Aún no hay actividad registrada. ¡Agrega tu primer gasto o juego de casino!
            </div>
          ) : (
            recentActivities.map((act) => {
              const isCasino = act.type === "casino";
              const isProfit = act.isProfit;

              return (
                <div
                  key={act.id}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isCasino ? (
                      <div className={`rounded-full p-2.5 flex-shrink-0 ${isProfit ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                        <Award className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className={`rounded-full p-2.5 flex-shrink-0 ${getCategoryDetails(act.category || "").color
                        } text-white`}>
                        {React.createElement(getCategoryDetails(act.category || "").icon, { className: "h-5 w-5" })}
                      </div>
                    )}

                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-foreground truncate">{act.title}</span>
                      <span className="text-xs text-muted-foreground truncate leading-normal">{act.subtitle}</span>
                      <span className="text-[10px] text-muted-foreground/80 mt-0.5">{act.date}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 font-bold text-sm">
                    {isCasino ? (
                      <span className={isProfit ? "text-success" : "text-destructive"}>
                        {isProfit ? "+" : ""}{formatUSD(act.amount)}
                      </span>
                    ) : (
                      <span className="text-foreground">
                        -{formatUSD(act.amount)}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-normal capitalize">
                      {isCasino ? "Casino" : "Gasto"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div >
  );
}
