"use client";

import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "@/lib/api";

type Dept = { id: number; name: string };

export default function DeptMultiSelect({
  value, onChange, label = "Permissions (Departments)"
}: { value: number[]; onChange: (ids: number[]) => void; label?: string }) {
  const [all, setAll] = useState<Dept[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getDepartments().then(setAll).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter(d => d.name.toLowerCase().includes(q) && !value.includes(d.id)) : all.filter(d => !value.includes(d.id));
  }, [all, value, query]);

  function add(id: number) { if (!value.includes(id)) onChange([...value, id]); setQuery(""); setOpen(false); }
  function remove(id: number) { onChange(value.filter(v => v !== id)); }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative rounded-lg border border-slate-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto px-2 py-2">
          {value.map(id => {
            const d = all.find(x => x.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-2 rounded-full bg-cyan-50 text-cyan-700 px-3 py-1 border border-cyan-200">
                {d?.name ?? id}
                <button type="button" onClick={() => remove(id)} className="text-cyan-700 hover:text-cyan-900">×</button>
              </span>
            );
          })}
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            placeholder="Search departments…"
            className="inline-flex flex-none w-48 md:w-40 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none border-0 focus:ring-0"
          />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-52 overflow-auto rounded-md ring-1 ring-slate-200 bg-white shadow-lg">
            {filtered.map(d => (
              <button
                key={d.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(d.id)}
                className="w-full text-left px-3 py-2 text-sm bg-white text-slate-800 hover:bg-slate-100"
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}