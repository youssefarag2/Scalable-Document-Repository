"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { DocSummary } from "@/lib/api";
import { downloadLatest } from "@/lib/api";

function humanizeBytes(b?: number | null) {
	if (!b || b <= 0) return "—";
	const kb = b / 1024;
	if (kb < 1024) return `${kb.toFixed(1)} KB`;
	return `${(kb / 1024).toFixed(2)} MB`;
}

export default function DocumentRow({ doc, sizeBytes }: { doc: DocSummary; sizeBytes?: number | null }) {
	const router = useRouter();
	const [downloading, setDownloading] = useState(false);

	async function onDownload(e: React.MouseEvent) {
		e.stopPropagation();
		try {
			setDownloading(true);
			const { blob, filename } = await downloadLatest(doc.id);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} finally {
			setDownloading(false);
		}
	}

	return (
		<div
			onClick={() => router.push(`/documents/${doc.id}`)}
			className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition"
		>
			<div className="flex items-center justify-between">
				<div>
					<div className="text-lg font-semibold text-slate-900">{doc.title}</div>
					<div className="text-sm text-slate-600 line-clamp-2">{doc.description ?? ""}</div>					<div className="mt-2 flex flex-wrap gap-2">
						{doc.tags.map((t) => (
							<span key={t} className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-2 py-1 border border-cyan-200">
								{t}
							</span>
						))}
					</div>
					<div className="mt-2 text-xs text-slate-500">
						Latest v{doc.current_version_number} • {humanizeBytes(sizeBytes)} • {doc.updated_at ? new Date(doc.updated_at).toLocaleString() : ""}
					</div>
				</div>
				<Button onClick={onDownload} className="ml-4" disabled={downloading}>
					{downloading ? "Downloading..." : "Download"}
				</Button>
			</div>
		</div>
	);
}