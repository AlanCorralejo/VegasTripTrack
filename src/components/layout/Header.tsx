"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Sun, Moon } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect initial theme
    const isDark = document.documentElement.classList.contains("dark") || 
      (localStorage.getItem("theme") === "dark") ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "Usuario"}
            className="w-9 h-9 rounded-full border border-primary/20"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {user.displayName?.charAt(0) || "U"}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground leading-none">Hola,</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">
            {user.displayName?.split(" ")[0]}
          </span>
        </div>
      </div>

      <h1 className="text-base font-black tracking-tight text-foreground flex items-center gap-1">
        <span>VEGAS</span>
        <span className="text-primary font-light">TRIP</span>
        <span>🎰</span>
      </h1>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          aria-label="Cambiar tema"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-400" />
          )}
        </button>
        <button
          onClick={logout}
          className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
