"use client";

import { useEffect, useState } from "react";
import type { DocSummary, VersionInfo } from "@/lib/api";
import { getVersions } from "@/lib/api";
import DocumentRow from "./DocumentRow";

export default function DocumentList({ docs }: { docs: DocSummary[] }) {
	const [sizes, setSizes] = useState<Record<number, number | null>>({});

	useEffect(() => {
		let mounted = true;
		async function load() {
			const entries = await Promise.all(
				docs.map(async (d) => {
					try {
						const versions: VersionInfo[] = await getVersions(d.id);
						const current = versions.find((v) => v.version_number === d.current_version_number);
						return [d.id, current?.file_size ?? null] as const;
					} catch {
						return [d.id, null] as const;
					}
				})
			);
			if (mounted) {
				const map: Record<number, number | null> = {};
				for (const [id, size] of entries) map[id] = size;
				setSizes(map);
			}
		}
		if (docs.length) load();
		return () => {
			mounted = false;
		};
	}, [docs]);

	return (
		<div className="grid grid-cols-1 gap-3">
			{docs.map((d) => (
				<DocumentRow key={d.id} doc={d} sizeBytes={sizes[d.id]} />
			))}
		</div>
	);
}