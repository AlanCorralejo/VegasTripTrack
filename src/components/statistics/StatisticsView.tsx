"use client";

import React, { useState, useEffect } from "react";
import { Expense, CasinoSession } from "@/services/db";
import { getCategoryDetails } from "@/utils/categories";
import { formatUSD, getTodayDateString, isDateInThisWeek, isDateInThisMonth } from "@/utils/date";
import { LoadingSpinner } from "@/components/ui/LoadingSkeleton";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { Calendar, ChevronDown, Award, TrendingUp, DollarSign } from "lucide-react";

interface StatisticsViewProps {
  expenses: Expense[];
  casinoSessions: CasinoSession[];
}

type TimeframeType = "today" | "week" | "month" | "custom";

export function StatisticsView({ expenses, casinoSessions }: StatisticsViewProps) {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<TimeframeType>("week");
  
  // Custom Date Range States
  const todayStr = getTodayDateString();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingSpinner />;
  }

  // Filter Data helper
  const filterByTimeframe = <T extends { date: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      if (timeframe === "today") return item.date === todayStr;
      if (timeframe === "week") return isDateInThisWeek(item.date);
      if (timeframe === "month") return isDateInThisMonth(item.date);
      if (timeframe === "custom") {
        return item.date >= startDate && item.date <= endDate;
      }
      return true;
    });
  };

  const filteredExpenses = filterByTimeframe(expenses);
  const filteredCasino = filterByTimeframe(casinoSessions);

  // 1. Expenses by Category (Pie Chart)
  const categoryTotals: { [key: string]: number } = {};
  filteredExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const CATEGORY_COLOR_MAP: { [key: string]: string } = {
    "bg-orange-500": "#f97316",
    "bg-amber-500": "#f59e0b",
    "bg-blue-400": "#60a5fa",
    "bg-amber-700": "#b45309",
    "bg-yellow-600": "#d97706",
    "bg-indigo-500": "#6366f1",
    "bg-slate-800": "#1e293b",
    "bg-purple-600": "#9333ea",
    "bg-pink-500": "#ec4899",
    "bg-teal-500": "#14b8a6",
    "bg-rose-500": "#f43f5e",
    "bg-emerald-500": "#10b981",
    "bg-slate-500": "#64748b",
  };

  const pieData = Object.entries(categoryTotals).map(([catId, amount]) => {
    const details = getCategoryDetails(catId);
    return {
      name: details.label,
      value: amount,
      color: CATEGORY_COLOR_MAP[details.color] || "#64748b",
    };
  });

  // 2. Expenses over time / Daily spending (Line/Bar Chart)
  const expensesByDate: { [key: string]: number } = {};
  filteredExpenses.forEach((e) => {
    expensesByDate[e.date] = (expensesByDate[e.date] || 0) + e.amount;
  });

  const dailyExpensesData = Object.entries(expensesByDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Casino Profit by Casino (Bar Chart)
  const casinoProfitByName: { [key: string]: number } = {};
  filteredCasino.forEach((s) => {
    casinoProfitByName[s.casinoName] = (casinoProfitByName[s.casinoName] || 0) + s.profit;
  });

  const casinoProfitData = Object.entries(casinoProfitByName).map(([name, profit]) => ({
    casino: name,
    ganancia: profit,
  }));

  // 4. Cumulative Casino Bankroll (Line Chart)
  // Sort oldest first for cumulative math
  const sortedCasino = [...filteredCasino].sort((a, b) => a.date.localeCompare(b.date));
  let runningBankroll = 0;
  const bankrollData = sortedCasino.map((session, idx) => {
    runningBankroll += session.profit;
    return {
      index: idx + 1,
      casino: session.casinoName,
      date: session.date,
      bankroll: runningBankroll,
    };
  });

  // 5. Monthly Expenses & Monthly Casino Profit
  const monthlyDataMap: { [key: string]: { month: string; gastos: number; casino: number } } = {};
  
  // Collect expenses monthly
  expenses.forEach((e) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { month, gastos: 0, casino: 0 };
    }
    monthlyDataMap[month].gastos += e.amount;
  });

  // Collect casino monthly
  casinoSessions.forEach((s) => {
    const month = s.date.substring(0, 7);
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { month, gastos: 0, casino: 0 };
    }
    monthlyDataMap[month].casino += s.profit;
  });

  const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.month.localeCompare(b.month));

  // Custom tooltips
  const CustomUSDTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-xl shadow-lg text-xs font-semibold">
          <p className="text-muted-foreground mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || p.fill }}>
              {p.name}: {formatUSD(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Timeframe selector header */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Filtro de Tiempo</span>
          <div className="relative">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeframeType)}
              className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none appearance-none font-bold pr-8"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="custom">Rango Personalizado</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Custom Range Inputs */}
        {timeframe === "custom" && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 animate-in slide-in-from-top-1 duration-150">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 1. Pie Chart - Expenses by category */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          <DollarSign className="h-4 w-4 text-primary" />
          Gastos por Categoría
        </h3>
        {pieData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Sin datos para este periodo.</p>
        ) : (
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomUSDTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Daily spending Bar Chart */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          <Calendar className="h-4 w-4 text-primary" />
          Gasto Diario
        </h3>
        {dailyExpensesData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Sin datos de gastos.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyExpensesData} margin={{ left: -20, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomUSDTooltip />} />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Gastado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Expenses over time (Line Chart) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          📈 Gastos a lo Largo del Tiempo
        </h3>
        {dailyExpensesData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Sin datos.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyExpensesData} margin={{ left: -20, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomUSDTooltip />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2.5} name="Gasto acumulado" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Casino profit by Casino (Bar Chart) */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          🎰 Rendimiento por Casino
        </h3>
        {casinoProfitData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Sin juegos de casino registrados.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={casinoProfitData} margin={{ left: -20, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="casino" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomUSDTooltip />} />
                <Bar 
                  dataKey="ganancia" 
                  name="Ganancia/Pérdida" 
                  radius={[4, 4, 0, 0]}
                >
                  {casinoProfitData.map((entry, idx) => (
                    <Cell 
                      key={`cell-${idx}`} 
                      fill={entry.ganancia >= 0 ? "var(--color-success)" : "var(--color-destructive)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. Cumulative Casino Bankroll */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          💰 Capital de Casino Acumulado
        </h3>
        {bankrollData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">Sin datos de juego de casino.</p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bankrollData} margin={{ left: -20, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomUSDTooltip />} />
                <Line type="monotone" dataKey="bankroll" stroke="var(--color-success)" strokeWidth={2.5} name="Capital ($)" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 6. Monthly Overview */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5 px-1">
          📅 Historial Mensual (Gastos vs Casino)
        </h3>
        {monthlyData.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">No hay registros históricos.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ left: -20, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomUSDTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="gastos" name="Gastos ($)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="casino" name="Casino ($)" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
