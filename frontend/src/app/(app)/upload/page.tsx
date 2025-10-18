"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DeptMultiSelect from "@/components/documents/DeptMultiSelect";
import TagMultiSelect from "@/components/documents/TagMultiSelect";
import { uploadDocument } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsCsv, setTagsCsv] = useState(""); // allow creating new tags
  const [deptIds, setDeptIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) { setError("Please choose a file"); return; }

    const fd = new FormData();
    fd.append("title", title);
    if (description) fd.append("description", description);
	const tagsCsv = tags.join(",");
    if (tagsCsv) fd.append("tags", tagsCsv);
    if (deptIds.length) fd.append("permission_department_ids", deptIds.join(","));
    fd.append("file", file);

    setLoading(true);
    try {
      await uploadDocument(fd);
      router.push("/"); // back to All Documents
    } catch (e) {
        const err = e as AxiosError<{ detail?: string }>;
 		 setError(err.response?.data?.detail ?? err.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Upload Document</h1>
        <p className="text-slate-600">Create a new document (v1).</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4 max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
		<TagMultiSelect value={tags} onChange={setTags} allowCreate />
        <DeptMultiSelect value={deptIds} onChange={setDeptIds} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm" required />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload"}</Button>
      </form>
    </div>
  );
}