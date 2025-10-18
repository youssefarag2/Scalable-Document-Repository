import React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label: string;
	error?: string;
};

export default function Input({ label, error, ...rest }: Props) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-sm font-medium text-slate-700">{label}</label>
			<input
				{...rest}
				className={`w-full rounded-lg border bg-white px-3 py-2 shadow-sm outline-none transition
				text-black
				placeholder:text-slate-400
				focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
				${error ? "border-red-500" : "border-slate-300 hover:border-slate-400"}`}
			/>
			{error ? <span className="text-xs text-red-600">{error}</span> : null}
		</div>
	);
}