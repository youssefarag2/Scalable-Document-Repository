"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
	user: { name: string };
	onLogout: () => void;
};

const links = [
	{ href: "/", label: "All Documents" },
	{ href: "/my-documents", label: "My Documents" },
	{ href: "/upload", label: "Upload Document" },
];

export default function Sidebar({ user, onLogout }: Props) {
	const pathname = usePathname();
	return (
		<aside className="w-64 shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur">
			{/* Header */}
			<div className="p-4 border-b border-slate-200">
				<div className="flex items-center justify-between">
					<div className="flex flex-col">
						<span className="text-xs uppercase tracking-wide text-slate-500">Welcome</span>
						<span className="text-base font-semibold text-slate-900">{user?.name || "User"}</span>
					</div>
					<button
						onClick={onLogout}
						className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00A0D2] to-[#00838F] px-3 py-2 text-white text-sm shadow hover:from-[#0095C5] hover:to-[#007A86] focus:outline-none focus:ring-2 focus:ring-[#00A0D2]/40"
						aria-label="Logout"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
							<path d="M16 17v-2h-5v-2h5V11l3 3-3 3z" />
							<path d="M13 3a1 1 0 011 1v4h-2V5H6v14h6v-3h2v3a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1h8z" />
						</svg>
						Logout
					</button>
				</div>
			</div>

			{/* Nav */}
			<nav className="flex flex-col py-2">
				{links.map((l) => {
					const active = pathname === l.href;
					return (
						<Link
							key={l.href}
							href={l.href}
							className={`px-5 py-2.5 transition flex items-center gap-2
								${active
									? "bg-cyan-50 text-cyan-700 border-l-4 border-[#00A0D2] font-medium"
									: "text-slate-700 hover:bg-slate-50"}`}
						>
							<span>{l.label}</span>
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}