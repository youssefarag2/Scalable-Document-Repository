"use client";

import { useEffect, useState } from "react";
import type { DocSummary } from "@/lib/api";
import { listMyDocs } from "@/lib/api";
import DocumentList from "@/components/documents/DocumentList";

export default function MyDocumentsPage() {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyDocs().then(setDocs).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Documents</h1>
        <p className="text-slate-600">Documents you uploaded.</p>
      </div>
      {loading ? (
  		<div className="text-slate-600">Loading...</div>
		) : docs.length === 0 ? (
		<div className="min-h-[50vh] flex items-center justify-center">
			<p className="text-2xl font-semibold text-slate-400">No Documents Yet.</p>
		</div>
		) : (
		<DocumentList docs={docs} />
	)}
    </div>
  );
}