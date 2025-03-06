"use client";

import Link from "next/link";
import { useTheme } from "./contexts/ThemeContext";

export default function NotFound() {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-2xl opacity-30"></div>
          <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 w-24 h-24 mx-auto rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
          Página no encontrada
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
} 