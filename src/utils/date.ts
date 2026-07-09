export function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isDateInThisWeek(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  
  // Get current day of week (0 is Sunday, 6 is Saturday)
  const currentDay = today.getDay();
  // Distance to Monday (if today is Sunday (0), distance is 6 days back)
  const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return date >= monday && date <= sunday;
}

export function isDateInThisMonth(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

export function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
