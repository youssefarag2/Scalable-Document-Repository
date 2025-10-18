import "./globals.css";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
	title: "Document Repository",
	description: "Scalable document repository POC",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body className={`${inter.className} min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 text-slate-900 antialiased`}>
			{children}
			</body>
		</html>
	);
}