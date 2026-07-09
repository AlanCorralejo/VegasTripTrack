import { 
  Utensils, 
  Beer, 
  Droplet, 
  Coffee, 
  Cookie, 
  Car, 
  Hotel, 
  Ticket, 
  Sparkles, 
  ShoppingBag, 
  Coins, 
  HelpCircle,
  LucideIcon
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  text: string;
}

export const CATEGORIES: Category[] = [
  { id: "Food", label: "Comida", icon: Utensils, color: "bg-orange-500", text: "text-orange-500" },
  { id: "Beer", label: "Cerveza", icon: Beer, color: "bg-amber-500", text: "text-amber-500" },
  { id: "Water", label: "Agua", icon: Droplet, color: "bg-blue-400", text: "text-blue-400" },
  { id: "Coffee", label: "Café", icon: Coffee, color: "bg-amber-700", text: "text-amber-700" },
  { id: "Snacks", label: "Snacks", icon: Cookie, color: "bg-yellow-600", text: "text-yellow-600" },
  { id: "Transportation", label: "Transporte", icon: Car, color: "bg-indigo-500", text: "text-indigo-500" },
  { id: "Uber", label: "Uber", icon: Car, color: "bg-slate-800", text: "text-slate-800 dark:text-slate-100" },
  { id: "Hotel", label: "Hotel", icon: Hotel, color: "bg-purple-600", text: "text-purple-600" },
  { id: "Shows", label: "Shows", icon: Ticket, color: "bg-pink-500", text: "text-pink-500" },
  { id: "Attractions", label: "Atracciones", icon: Sparkles, color: "bg-teal-500", text: "text-teal-500" },
  { id: "Shopping", label: "Compras", icon: ShoppingBag, color: "bg-rose-500", text: "text-rose-500" },
  { id: "Tips", label: "Propinas", icon: Coins, color: "bg-emerald-500", text: "text-emerald-500" },
  { id: "Other", label: "Otros", icon: HelpCircle, color: "bg-slate-500", text: "text-slate-500" },
];

export const getCategoryDetails = (id: string): Category => {
  return CATEGORIES.find(c => c.id === id) || { id: "Other", label: "Otros", icon: HelpCircle, color: "bg-slate-500", text: "text-slate-500" };
};
