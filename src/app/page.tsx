"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTripData } from "@/hooks/useTripData";
import { Header } from "@/components/layout/Header";
import { BottomNav, TabType } from "@/components/layout/BottomNav";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { ExpensesView } from "@/components/expenses/ExpensesView";
import { CasinoView } from "@/components/casino/CasinoView";
import { StatisticsView } from "@/components/statistics/StatisticsView";
import { LoadingSpinner } from "@/components/ui/LoadingSkeleton";

export default function MainPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { expenses, casinoSessions, loading: dataLoading } = useTripData();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      setSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Landing view when not authenticated
  if (!user) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#0b0f19] px-6 text-white overflow-hidden">
        {/* Neon decorative blurred circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 h-[250px] w-[250px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 h-[250px] w-[250px] rounded-full bg-rose-500/10 blur-[80px] pointer-events-none" />

        <div className="z-10 flex flex-col items-center text-center max-w-sm">
          <div className="animate-bounce mb-6 text-6xl">🎰</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            VEGAS <span className="text-primary font-light">TRACKER</span>
          </h1>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Lleva el control de tus gastos de viaje y estadísticas de tus juegos de casino de forma sencilla y en tiempo real.
          </p>

          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl py-3.5 px-6 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {signingIn ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ea4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.96 3.07C6.27 7.7 8.89 5.04 12 5.04z"
                />
                <path
                  fill="#4285f4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.66-2.32 3.49l3.6 2.79c2.1-1.94 3.3-4.8 3.3-8.43z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.35 14.9c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.39 7.23C.5 9.01 0 10.99 0 13s.5 3.99 1.39 5.77l3.96-3.07z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-.99.66-2.27 1.06-3.71 1.06-3.11 0-5.73-2.09-6.65-4.91L1.04 16.5C3.03 20.33 7.2 23 12 23z"
                />
              </svg>
            )}
            <span>{signingIn ? "Iniciando sesión..." : "Iniciar sesión con Google"}</span>
          </button>

          <span className="text-[10px] text-slate-500 mt-6 leading-normal block">
            Tus datos se guardarán de forma segura en tu cuenta personal de Google en Cloud Firestore.
          </span>
        </div>
      </main>
    );
  }

  // Dashboard layout for authenticated users
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <Header />
      
      <main className="flex-1 px-4 pt-4 overflow-y-auto max-w-md mx-auto w-full">
        {dataLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardView 
                expenses={expenses} 
                casinoSessions={casinoSessions} 
                setActiveTab={setActiveTab} 
              />
            )}
            {activeTab === "expenses" && (
              <ExpensesView expenses={expenses} />
            )}
            {activeTab === "casino" && (
              <CasinoView sessions={casinoSessions} />
            )}
            {activeTab === "statistics" && (
              <StatisticsView expenses={expenses} casinoSessions={casinoSessions} />
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
