"use client";

import React, { useState, useEffect } from "react";
import { Expense, addExpenseRecord, updateExpenseRecord, deleteExpenseRecord } from "@/services/db";
import { getCategoryDetails, CATEGORIES } from "@/utils/categories";
import { formatUSD, getTodayDateString, isDateInThisWeek, isDateInThisMonth } from "@/utils/date";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

interface ExpensesViewProps {
  expenses: Expense[];
}

export function ExpensesView({ expenses }: ExpensesViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = getTodayDateString();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDate, setFilterDate] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Bottom Sheet States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  // Form Field States
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState("");

  // Delete Dialog States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Load Draft for New Expenses
  useEffect(() => {
    if (isFormOpen && !editing) {
      const draft = localStorage.getItem("expense_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setAmount(parsed.amount || "");
          setCategory(parsed.category || "Food");
          setDate(parsed.date || todayStr);
          setNotes(parsed.notes || "");
        } catch (e) {
          console.error("Error reading draft", e);
        }
      }
    } else if (isFormOpen && editing) {
      // Set to edited expense fields
      setAmount(editing.amount.toString());
      setCategory(editing.category);
      setDate(editing.date);
      setNotes(editing.notes || "");
    }
  }, [isFormOpen, editing]);

  // Save Draft
  useEffect(() => {
    if (isFormOpen && !editing) {
      localStorage.setItem("expense_draft", JSON.stringify({ amount, category, date, notes }));
    }
  }, [amount, category, date, notes, isFormOpen, editing]);

  const clearForm = () => {
    setAmount("");
    setCategory("Food");
    setDate(todayStr);
    setNotes("");
    setEditing(null);
    localStorage.removeItem("expense_draft");
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditing(expense);
    setIsFormOpen(true);
  };

  const handleDuplicate = (expense: Expense) => {
    setEditing(null);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(todayStr); // set to today's date for duplicated expense
    setNotes(`${expense.notes || ""} (Copia)`.trim());
    setIsFormOpen(true);
    toast("Campos copiados. Toca en Guardar para registrar el duplicado.", { type: "default" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!amount || Number(amount) <= 0) {
      toast("Ingresa un monto válido mayor a 0", { type: "destructive" });
      return;
    }

    try {
      const record = {
        category,
        amount: Number(amount),
        date,
        notes: notes.trim(),
      };

      if (editing) {
        await updateExpenseRecord(user.uid, editing.id, record);
        toast("Gasto actualizado exitosamente", { type: "success" });
      } else {
        await addExpenseRecord(user.uid, record);
        toast("Gasto registrado exitosamente", { type: "success" });
      }
      setIsFormOpen(false);
      clearForm();
    } catch (err) {
      console.error(err);
      toast("Error al guardar el gasto", { type: "destructive" });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteExpenseRecord(user.uid, deleteId);
      toast("Gasto eliminado exitosamente", { type: "success" });
      setDeleteId(null);
    } catch (err) {
      console.error(err);
      toast("Error al eliminar el gasto", { type: "destructive" });
    }
  };

  // Filter & Sort Logic
  const filteredExpenses = expenses
    .filter((e) => {
      const details = getCategoryDetails(e.category);
      const matchesSearch = 
        e.notes?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        details.label.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = filterCategory === "All" || e.category === filterCategory;

      let matchesDate = true;
      if (filterDate === "Today") {
        matchesDate = e.date === todayStr;
      } else if (filterDate === "Week") {
        matchesDate = isDateInThisWeek(e.date);
      } else if (filterDate === "Month") {
        matchesDate = isDateInThisMonth(e.date);
      } else if (filterDate !== "All") {
        matchesDate = e.date === filterDate;
      }

      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.date.localeCompare(a.date);
      if (sortBy === "oldest") return a.date.localeCompare(b.date);
      if (sortBy === "highest") return b.amount - a.amount;
      return 0;
    });

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Header bar with total spent */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-muted-foreground font-semibold">Total Gastado</span>
          <h2 className="text-2xl font-black text-foreground">
            {formatUSD(expenses.reduce((sum, e) => sum + e.amount, 0))}
          </h2>
        </div>
        <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
          {filteredExpenses.length} transacciones
        </span>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por notas o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-xl border border-border p-2.5 flex items-center justify-center transition-all shadow-sm ${
            showFilters || filterCategory !== "All" || filterDate !== "All" || sortBy !== "newest"
              ? "bg-primary text-white border-primary"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Filters Expandable Section */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Categoría</label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none appearance-none font-medium pr-8"
                >
                  <option value="All">Todas</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Fecha</label>
              <div className="relative">
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none appearance-none font-medium pr-8"
                >
                  <option value="All">Cualquiera</option>
                  <option value="Today">Hoy</option>
                  <option value="Week">Esta Semana</option>
                  <option value="Month">Este Mes</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sorting Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ordenar Por</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none appearance-none font-medium pr-8"
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="highest">Monto más alto</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCategory("All");
                  setFilterDate("All");
                  setSortBy("newest");
                  setSearchQuery("");
                }}
                className="w-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border text-sm font-semibold rounded-xl py-2.5 transition-colors"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Cards List */}
      <div className="flex flex-col gap-3">
        {filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
            <span className="text-4xl">🧾</span>
            <p className="font-semibold">No se encontraron gastos</p>
            <p className="text-xs text-muted-foreground/80">Intenta cambiar los filtros de búsqueda o agrega un nuevo gasto.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const catDetails = getCategoryDetails(exp.category);
            const Icon = catDetails.icon;

            return (
              <div
                key={exp.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-3 relative overflow-hidden active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`rounded-xl ${catDetails.color} p-2.5 text-white flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground truncate">{catDetails.label}</span>
                      <span className="text-[10px] text-muted-foreground/85 bg-secondary px-1.5 py-0.5 rounded font-bold">{exp.date}</span>
                    </div>
                    {exp.notes ? (
                      <span className="text-xs text-muted-foreground truncate max-w-[180px] leading-normal">{exp.notes}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50 italic leading-normal">Sin notas</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-extrabold text-foreground pr-1">
                    {formatUSD(exp.amount)}
                  </span>
                  
                  {/* Actions (edit, duplicate, delete) */}
                  <div className="flex items-center bg-secondary/80 rounded-lg p-0.5">
                    <button
                      onClick={() => handleDuplicate(exp)}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(exp)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(exp.id)}
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
        aria-label="Agregar Gasto"
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
        title={editing ? "Editar Gasto" : "Agregar Gasto"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Monto (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all font-bold"
              required
            />
          </div>

          {/* Category Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Categoría
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none appearance-none font-semibold pr-10"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            </div>
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

          {/* Notes Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Notas
            </label>
            <textarea
              placeholder="Detalles adicionales (ej. Uber al Bellagio, propina crupier...)"
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
            {editing ? "Actualizar Gasto" : "Guardar Gasto"}
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
        title="¿Eliminar Gasto?"
        description="Esta acción eliminará de forma permanente el registro del gasto de tu base de datos en la nube. Esta acción no se puede deshacer."
      />
    </div>
  );
}
