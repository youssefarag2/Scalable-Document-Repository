"use client";

import { useEffect, useState } from "react";
import SearchBar from "@/components/documents/SearchBar";
import DocumentList from "@/components/documents/DocumentList";
import type { DocSummary } from "@/lib/api";
import { listAccessibleDocs, searchDocuments } from "@/lib/api";

export default function AllDocumentsPage() {
	const [docs, setDocs] = useState<DocSummary[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		listAccessibleDocs()
			.then((res) => setDocs(res))
			.finally(() => setLoading(false));
	}, []);

	async function onSearch(q: { title?: string; description?: string; tagsCsv?: string; version?: number }) {
		setLoading(true);
		try {
			const res = await searchDocuments(q);
			setDocs(res);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-5">
			<div>
				<h1 className="text-2xl font-semibold text-slate-900">All Documents</h1>
				<p className="text-slate-600">Search and browse documents you can access.</p>
			</div>
			<SearchBar onSearch={onSearch} />
			{loading ? <div className="text-slate-600">Loading...</div> : <DocumentList docs={docs} />}
		</div>
	);
}