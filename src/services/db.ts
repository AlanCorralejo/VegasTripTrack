import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/config/firebase";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  currency?: "USD" | "MXN";
  originalAmount?: number;
  exchangeRate?: number;
  date: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CasinoSession {
  id: string;
  casinoName: string;
  buyIn: number;
  cashOut: number;
  profit: number;
  date: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

const SHARED_TRIP_ID = "viaje_compartido_vegas";

// Get expenses collection path
export const getExpensesCollection = (userId?: string) => {
  return collection(db, "users", SHARED_TRIP_ID, "expenses");
};

// Get casino sessions collection path
export const getCasinoSessionsCollection = (userId?: string) => {
  return collection(db, "users", SHARED_TRIP_ID, "casinoSessions");
};

// CRUD for Expenses
export const addExpenseRecord = async (userId: string, expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
  const colRef = getExpensesCollection(SHARED_TRIP_ID);
  return addDoc(colRef, {
    ...expense,
    amount: Number(expense.amount),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateExpenseRecord = async (userId: string, expenseId: string, expense: Partial<Omit<Expense, "id" | "createdAt" | "updatedAt">>) => {
  const docRef = doc(db, "users", SHARED_TRIP_ID, "expenses", expenseId);
  const updates: any = { ...expense };
  if (expense.amount !== undefined) {
    updates.amount = Number(expense.amount);
  }
  updates.updatedAt = serverTimestamp();
  return updateDoc(docRef, updates);
};

export const deleteExpenseRecord = async (userId: string, expenseId: string) => {
  const docRef = doc(db, "users", SHARED_TRIP_ID, "expenses", expenseId);
  return deleteDoc(docRef);
};

// CRUD for Casino Sessions
export const addCasinoSessionRecord = async (userId: string, session: Omit<CasinoSession, "id" | "createdAt" | "updatedAt" | "profit">) => {
  const colRef = getCasinoSessionsCollection(SHARED_TRIP_ID);
  const profit = Number(session.cashOut) - Number(session.buyIn);
  return addDoc(colRef, {
    ...session,
    buyIn: Number(session.buyIn),
    cashOut: Number(session.cashOut),
    profit,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCasinoSessionRecord = async (
  userId: string, 
  sessionId: string, 
  session: Partial<Omit<CasinoSession, "id" | "createdAt" | "updatedAt">>
) => {
  const docRef = doc(db, "users", SHARED_TRIP_ID, "casinoSessions", sessionId);
  const updates: any = { ...session };
  
  if (session.buyIn !== undefined) updates.buyIn = Number(session.buyIn);
  if (session.cashOut !== undefined) updates.cashOut = Number(session.cashOut);
  if (session.profit !== undefined) updates.profit = Number(session.profit);
  
  updates.updatedAt = serverTimestamp();
  return updateDoc(docRef, updates);
};

export const deleteCasinoSessionRecord = async (userId: string, sessionId: string) => {
  const docRef = doc(db, "users", SHARED_TRIP_ID, "casinoSessions", sessionId);
  return deleteDoc(docRef);
};
