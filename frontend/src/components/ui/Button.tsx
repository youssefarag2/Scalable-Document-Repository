import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ children, className = "", ...rest }: Props) {
	return (
		<button
			{...rest}
			className={`inline-flex items-center justify-center rounded-lg
			bg-gradient-to-r from-[#00A0D2] to-[#00838F]
			px-4 py-2 font-medium text-white shadow-sm transition
			hover:from-[#0095C5] hover:to-[#007A86]
			focus:outline-none focus:ring-2 focus:ring-[#00A0D2]/40
			disabled:opacity-60 ${className}`}
		>
			{children}
		</button>
	);
}