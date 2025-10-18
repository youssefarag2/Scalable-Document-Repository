"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { useAuthRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { user, loading } = useAuthRedirect();

	function onLogout() {
		localStorage.removeItem("access_token");
		router.replace("/login");
	}

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center text-slate-600">Loading...</div>;
	}
	return (
		<div className="min-h-screen flex bg-gray-50">
			<Sidebar user={user!} onLogout={onLogout} />
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}