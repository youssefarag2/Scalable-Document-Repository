"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TagMultiSelect from "./TagMultiSelect";

export default function SearchBar({ onSearch }: { onSearch: (q: { title?: string; description?: string; tagsCsv?: string; version?: number }) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [version, setVersion] = useState<string>("");

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Policy" />
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., company" />
      <TagMultiSelect value={tags} onChange={setTags} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Version</label>
        <input
          type="number"
          min={1}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm outline-none transition border-slate-300 hover:border-slate-400 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
          placeholder="e.g., 2"
        />
      </div>
      <div className="md:col-span-4">
        <Button
          type="button"
          onClick={() =>
            onSearch({
              title: title || undefined,
              description: description || undefined,
              tagsCsv: tags.length ? tags.join(",") : undefined,
              version: version ? Number(version) : undefined,
            })
          }
        >
          Search
        </Button>
      </div>
    </div>
  );
}