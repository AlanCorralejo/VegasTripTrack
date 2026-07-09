"use client";

import React, { useState, useEffect } from "react";
import { CasinoSession, addCasinoSessionRecord, updateCasinoSessionRecord, deleteCasinoSessionRecord } from "@/services/db";
import { formatUSD, getTodayDateString } from "@/utils/date";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  DollarSign, 
  FileText, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Dice5, 
  ChevronDown
} from "lucide-react";

interface CasinoViewProps {
  sessions: CasinoSession[];
}

// Popular Vegas Casinos mapping for custom icons/emojis
const getCasinoIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("bellagio")) return { emoji: "⛲", color: "bg-blue-900" };
  if (n.includes("caesars") || n.includes("cesar")) return { emoji: "🏛️", color: "bg-amber-600" };
  if (n.includes("mgm") || n.includes("grand")) return { emoji: "🦁", color: "bg-emerald-800" };
  if (n.includes("wynn") || n.includes("encore")) return { emoji: "💎", color: "bg-yellow-700" };
  if (n.includes("venetian") || n.includes("palazzo")) return { emoji: "🛶", color: "bg-cyan-700" };
  if (n.includes("cosmo") || n.includes("cosmopolitan")) return { emoji: "🍸", color: "bg-rose-950" };
  if (n.includes("paris")) return { emoji: "🗼", color: "bg-indigo-900" };
  if (n.includes("mirage")) return { emoji: "🌋", color: "bg-orange-700" };
  if (n.includes("mandalay")) return { emoji: "🦈", color: "bg-teal-700" };
  if (n.includes("luxor")) return { emoji: "📐", color: "bg-violet-950" };
  if (n.includes("flamingo")) return { emoji: "🦩", color: "bg-pink-500" };
  if (n.includes("circus")) return { emoji: "🎪", color: "bg-red-600" };
  if (n.includes("aria")) return { emoji: "✨", color: "bg-zinc-800" };
  if (n.includes("horseshoe") || n.includes("bally")) return { emoji: "🧲", color: "bg-red-800" };
  return { emoji: "🎰", color: "bg-primary" };
};

export function CasinoView({ sessions }: CasinoViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = getTodayDateString();

  // Bottom Sheet States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<CasinoSession | null>(null);

  // Form Field States
  const [casinoName, setCasinoName] = useState("");
  const [date, setDate] = useState(todayStr);
  const [buyIn, setBuyIn] = useState("");
  const [cashOut, setCashOut] = useState("");
  const [notes, setNotes] = useState("");

  // Delete Dialog States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Dashboard calculations
  const totalBuyIn = sessions.reduce((sum, s) => sum + s.buyIn, 0);
  const totalCashOut = sessions.reduce((sum, s) => sum + s.cashOut, 0);
  const netCasinoProfit = totalCashOut - totalBuyIn;
  const sessionCount = sessions.length;
  const averageSessionProfit = sessionCount > 0 ? netCasinoProfit / sessionCount : 0;

  // Load Draft for New Sessions
  useEffect(() => {
    if (isFormOpen && !editing) {
      const draft = localStorage.getItem("casino_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setCasinoName(parsed.casinoName || "");
          setDate(parsed.date || todayStr);
          setBuyIn(parsed.buyIn || "");
          setCashOut(parsed.cashOut || "");
          setNotes(parsed.notes || "");
        } catch (e) {
          console.error("Error reading casino draft", e);
        }
      }
    } else if (isFormOpen && editing) {
      setCasinoName(editing.casinoName);
      setDate(editing.date);
      setBuyIn(editing.buyIn.toString());
      setCashOut(editing.cashOut.toString());
      setNotes(editing.notes || "");
    }
  }, [isFormOpen, editing]);

  // Save Draft
  useEffect(() => {
    if (isFormOpen && !editing) {
      localStorage.setItem("casino_draft", JSON.stringify({ casinoName, date, buyIn, cashOut, notes }));
    }
  }, [casinoName, date, buyIn, cashOut, notes, isFormOpen, editing]);

  const clearForm = () => {
    setCasinoName("");
    setDate(todayStr);
    setBuyIn("");
    setCashOut("");
    setNotes("");
    setEditing(null);
    localStorage.removeItem("casino_draft");
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (session: CasinoSession) => {
    setEditing(session);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!casinoName.trim()) {
      toast("Ingresa el nombre del casino", { type: "destructive" });
      return;
    }

    if (!buyIn || Number(buyIn) < 0) {
      toast("El Buy In debe ser 0 o mayor", { type: "destructive" });
      return;
    }

    if (!cashOut || Number(cashOut) < 0) {
      toast("El Cash Out debe ser 0 o mayor", { type: "destructive" });
      return;
    }

    try {
      const buyInNum = Number(buyIn);
      const cashOutNum = Number(cashOut);
      const profitNum = cashOutNum - buyInNum;

      if (editing) {
        await updateCasinoSessionRecord(user.uid, editing.id, {
          casinoName: casinoName.trim(),
          date,
          buyIn: buyInNum,
          cashOut: cashOutNum,
          profit: profitNum,
          notes: notes.trim(),
        });
        toast("Sesión de casino actualizada", { type: "success" });
      } else {
        await addCasinoSessionRecord(user.uid, {
          casinoName: casinoName.trim(),
          date,
          buyIn: buyInNum,
          cashOut: cashOutNum,
          notes: notes.trim(),
        });
        toast("Sesión de casino agregada", { type: "success" });
      }
      setIsFormOpen(false);
      clearForm();
    } catch (err) {
      console.error(err);
      toast("Error al guardar la sesión", { type: "destructive" });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteCasinoSessionRecord(user.uid, deleteId);
      toast("Sesión eliminada exitosamente", { type: "success" });
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast("Error al eliminar la sesión", { type: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Casino Overview Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total profit */}
        <div className="col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-1 items-center text-center">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Resultados de Casino Neto</span>
          <h2 className={`text-3xl font-black mt-1 ${netCasinoProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {netCasinoProfit >= 0 ? "+" : ""}{formatUSD(netCasinoProfit)}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Coins className="h-3.5 w-3.5" />
            <span>{sessionCount} {sessionCount === 1 ? "sesión jugada" : "sesiones jugadas"}</span>
          </div>
        </div>

        {/* Total buy-in & cash-out */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Total Buy-In</span>
          <p className="text-lg font-bold text-foreground truncate mt-1">{formatUSD(totalBuyIn)}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Total Cash-Out</span>
          <p className="text-lg font-bold text-foreground truncate mt-1">{formatUSD(totalCashOut)}</p>
        </div>

        {/* Avg session profit */}
        <div className="col-span-2 rounded-2xl bg-secondary/50 p-4 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Promedio por Sesión:</span>
          <span className={`text-sm font-extrabold ${averageSessionProfit >= 0 ? "text-success" : "text-destructive"}`}>
            {averageSessionProfit >= 0 ? "+" : ""}{formatUSD(averageSessionProfit)}
          </span>
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5 px-1">
          <Dice5 className="h-4.5 w-4.5 text-primary" />
          Historial de Juegos
        </h3>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">🎰</span>
            <p className="font-semibold">No hay sesiones de juego</p>
            <p className="text-xs text-muted-foreground/80">Toca el botón (+) de abajo para registrar tu primera jugada.</p>
          </div>
        ) : (
          sessions.map((sess) => {
            const isProfit = sess.profit >= 0;
            const logo = getCasinoIcon(sess.casinoName);

            return (
              <div
                key={sess.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-all"
              >
                {/* Header detail */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${logo.color}`}>
                      {logo.emoji}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-extrabold text-foreground truncate">{sess.casinoName}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{sess.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className={`text-base font-black ${isProfit ? "text-success" : "text-destructive"}`}>
                      {isProfit ? "+" : ""}{formatUSD(sess.profit)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">Neto</span>
                  </div>
                </div>

                {/* Submetrics grid */}
                <div className="grid grid-cols-2 gap-2 bg-secondary/50 rounded-xl p-2.5 text-xs">
                  <div className="flex justify-between px-1">
                    <span className="text-muted-foreground">Buy In:</span>
                    <span className="font-bold text-foreground">{formatUSD(sess.buyIn)}</span>
                  </div>
                  <div className="flex justify-between px-1 border-l border-border">
                    <span className="text-muted-foreground">Cash Out:</span>
                    <span className="font-bold text-foreground">{formatUSD(sess.cashOut)}</span>
                  </div>
                </div>

                {/* Notes & Actions bar */}
                <div className="flex justify-between items-center gap-4 pt-1.5 border-t border-border/60">
                  {sess.notes ? (
                    <p className="text-xs text-muted-foreground truncate leading-normal max-w-[200px]" title={sess.notes}>
                      {sess.notes}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic leading-normal">Sin notas</span>
                  )}

                  <div className="flex items-center bg-secondary/80 rounded-lg p-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(sess)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(sess.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-20 right-6 z-40 rounded-full bg-primary hover:bg-primary/95 text-white p-4 shadow-xl active:scale-95 transition-all shadow-primary/30"
        aria-label="Registrar Sesión"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Sheet Form */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          clearForm();
        }}
        title={editing ? "Editar Sesión" : "Registrar Sesión"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Casino Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              🎰 Casino
            </label>
            <input
              type="text"
              placeholder="Ej. Bellagio, Caesars Palace, MGM..."
              value={casinoName}
              onChange={(e) => setCasinoName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-semibold"
              required
            />
          </div>

          {/* Date Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-semibold"
              required
            />
          </div>

          {/* Buy In & Cash Out Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Buy In */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Buy In
              </label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                value={buyIn}
                onChange={(e) => setBuyIn(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
                required
              />
            </div>

            {/* Cash Out */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Cash Out
              </label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                value={cashOut}
                onChange={(e) => setCashOut(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
                required
              />
            </div>
          </div>

          {/* Notes Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Notas
            </label>
            <textarea
              placeholder="Detalles del juego (ej. Poker Texas Hold'em $1/$3, Blackjack, Blackjack en Cosmopolitan...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all min-h-[80px]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-white font-bold rounded-xl py-3 mt-2 shadow-lg shadow-primary/20 hover:shadow-none transition-all active:scale-98"
          >
            {editing ? "Actualizar Sesión" : "Guardar Sesión"}
          </button>
        </form>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Sesión?"
        description="Esta acción eliminará de forma permanente el registro del juego del casino. Esta acción no se puede deshacer y afectará el balance neto de tu viaje."
      />
    </div>
  );
}
