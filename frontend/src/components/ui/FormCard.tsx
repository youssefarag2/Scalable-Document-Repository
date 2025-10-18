import React, { ReactNode } from "react";

export default function FormCard({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
				<div className="mb-4">
					<h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
					{subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
				</div>
				{children}
			</div>
		</div>
	);
}