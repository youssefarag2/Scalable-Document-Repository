import React from "react";

type Option = { label: string; value: string | number };
type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
	label: string;
	options: Option[];
	error?: string;
};

export default function Select({ label, options, error, ...rest }: Props) {
	return (
		<div className="flex flex-col gap-1">
			<label className="text-sm font-medium text-slate-700">{label}</label>
			<select
				{...rest}
				className={`w-full rounded-lg border bg-white px-3 py-2 shadow-sm outline-none transition
				focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-black
				${error ? "border-red-500" : "border-slate-300 hover:border-slate-400"}`}
			>
				{options.map((o) => (
					<option key={o.value} value={o.value}>{o.label}</option>
				))}
			</select>
			{error ? <span className="text-xs text-red-600">{error}</span> : null}
		</div>
	);
}