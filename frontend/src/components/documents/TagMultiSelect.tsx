// frontend/src/components/documents/TagMultiSelect.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getTags } from "@/lib/api";

export default function TagMultiSelect({
  value,
  onChange,
  label = "Tags",
  allowCreate = false,
}: { value: string[]; onChange: (tags: string[]) => void; label?: string; allowCreate?: boolean }) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    getTags().then(r => setAllTags(r.map(x => x.name))).catch(() => setAllTags([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = allTags.filter(t => !value.includes(t));
    return q ? pool.filter(t => t.toLowerCase().includes(q)) : pool;
  }, [allTags, value, query]);

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t) return;
    if (!allTags.includes(t) && !allowCreate) return; // creation allowed only when allowCreate=true
    if (!value.includes(t)) onChange([...value, t]);
    setQuery("");
    setOpen(false);
    setActive(0);
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto px-2 py-2">
          {value.map(t => (
            <span key={t} className="inline-flex items-center gap-2 rounded-full bg-cyan-50 text-cyan-700 px-3 py-1 border border-cyan-200">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-cyan-700 hover:text-cyan-900">×</button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered[active]) addTag(filtered[active]);
                else if (allowCreate && query.trim()) addTag(query);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(i => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(i => Math.max(i - 1, 0));
              }
            }}
            placeholder="Search tags…"
            className="inline-flex flex-none w-40 md:w-28 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none border-0 focus:ring-0"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-52 overflow-auto rounded-md ring-1 ring-slate-200 bg-white shadow-lg">
            {filtered.map((t, idx) => (
              <button
                key={t}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(t)}
                className={`w-full text-left px-3 py-2 text-sm rounded-sm transition ${
                  idx === active ? "bg-cyan-50 text-cyan-700" : "bg-white text-slate-800 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}