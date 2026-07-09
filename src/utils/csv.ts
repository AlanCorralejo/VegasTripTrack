import { Expense, CasinoSession } from "@/services/db";

export function exportToCSV(expenses: Expense[], sessions: CasinoSession[]) {
  // UTF-8 BOM for Excel to display accents correctly
  let csv = "\uFEFF";
  
  // Section 1: Expenses
  csv += "=== REGISTRO DE GASTOS ===\r\n";
  csv += "Categoría,Monto (USD),Fecha,Notas\r\n";
  expenses.forEach((e) => {
    const row = [
      e.category,
      e.amount.toFixed(2),
      e.date,
      (e.notes || "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')
    ];
    csv += row.map(val => `"${val}"`).join(",") + "\r\n";
  });
  
  csv += "\r\n\r\n";
  
  // Section 2: Casino Sessions
  csv += "=== SESIONES DE CASINO ===\r\n";
  csv += "Casino,Buy In (USD),Cash Out (USD),Resultado Neto (USD),Fecha,Notas\r\n";
  sessions.forEach((s) => {
    const row = [
      s.casinoName,
      s.buyIn.toFixed(2),
      s.cashOut.toFixed(2),
      s.profit.toFixed(2),
      s.date,
      (s.notes || "").replace(/[\r\n]+/g, " ").replace(/"/g, '""')
    ];
    csv += row.map(val => `"${val}"`).join(",") + "\r\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `vegas_trip_data_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
