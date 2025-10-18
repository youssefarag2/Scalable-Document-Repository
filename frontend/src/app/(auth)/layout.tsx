
"use client"
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 text-slate-900">
      {children}
    </div>
  );
}