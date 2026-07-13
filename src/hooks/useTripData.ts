"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { 
  getExpensesCollection, 
  getCasinoSessionsCollection, 
  Expense, 
  CasinoSession 
} from "@/services/db";

export function useTripData() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [casinoSessions, setCasinoSessions] = useState<CasinoSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setCasinoSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query expenses ordered by date desc
    const expensesQuery = query(getExpensesCollection(user.uid), orderBy("date", "desc"));
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const list: Expense[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          category: data.category,
          amount: Number(data.amount),
          currency: data.currency || "USD",
          originalAmount: data.originalAmount !== undefined ? Number(data.originalAmount) : undefined,
          exchangeRate: data.exchangeRate !== undefined ? Number(data.exchangeRate) : undefined,
          date: data.date,
          notes: data.notes || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setExpenses(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses snapshot:", error);
      setLoading(false);
    });

    // Query casino sessions ordered by date desc
    const casinoQuery = query(getCasinoSessionsCollection(user.uid), orderBy("date", "desc"));
    const unsubscribeCasino = onSnapshot(casinoQuery, (snapshot) => {
      const list: CasinoSession[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          casinoName: data.casinoName,
          buyIn: Number(data.buyIn),
          cashOut: Number(data.cashOut),
          profit: Number(data.profit),
          date: data.date,
          notes: data.notes || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setCasinoSessions(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching casino snapshot:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeCasino();
    };
  }, [user]);

  return { expenses, casinoSessions, loading };
}
