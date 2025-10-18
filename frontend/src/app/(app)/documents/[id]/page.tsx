"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TagMultiSelect from "@/components/documents/TagMultiSelect";
import DeptMultiSelect from "@/components/documents/DeptMultiSelect";
import { getDocument, getVersions, downloadVersion, uploadNewVersion, updateDocument, type VersionInfo } from "@/lib/api";
import type { AxiosError } from "axios";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = Number(params?.id);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [deptIds, setDeptIds] = useState<number[]>([]);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [canUploadVersion, setCanUploadVersion] = useState(false);
  const [canEditMetadata, setCanEditMetadata] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDocument(docId);
      setTitle(d.title);
      setDescription(d.description ?? "");
      setTags(d.tags);
      setCurrentVersion(d.current_version_number);
      setOwnerId(d.owner_id);
      setCanUploadVersion(!!d.can_upload_version);
      setCanEditMetadata(!!d.can_edit_metadata);
      // permissions are not returned by details; leave editable via deptIds if you like (optional fetch later)
      const vs = await getVersions(docId);
      setVersions(vs);
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      setError(err.response?.data?.detail ?? err.message ?? "Failed to load document");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (!Number.isFinite(docId)) return; load(); }, [docId]);

  async function onDownload(v: number | "latest") {
    const { blob, filename } = await downloadVersion(docId, v);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function onUploadNewVersion(e: React.FormEvent) {
    e.preventDefault();
    if (!newFile) return;
    setUploading(true);
    setError(null);
    try {
      await uploadNewVersion(docId, newFile);
      setNewFile(null);
      await load();
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      setError(err.response?.data?.detail ?? err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSaveMetadata(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateDocument(docId, {
        title: title || undefined,
        description: description || undefined,
        tags: tags.length ? tags : undefined,
        permission_department_ids: deptIds.length ? deptIds : undefined,
      });
      await load();
    } catch (e) {
      const err = e as AxiosError<{ detail?: string }>;
      setError(err.response?.data?.detail ?? err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const latest = useMemo(() => versions.find(v => v.version_number === currentVersion), [versions, currentVersion]);

  if (loading) return <div className="text-slate-600">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-slate-600">{description || "No description"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="text-xs rounded-full bg-cyan-50 text-cyan-700 px-3 py-1 border border-cyan-200">{t}</span>
            ))}
          </div>
          <div className="mt-2 text-sm text-slate-500">Latest v{currentVersion}{latest?.file_size ? ` • ${(latest.file_size/1024/1024).toFixed(2)} MB` : ""}</div>
        </div>
        <Button onClick={() => onDownload("latest")}>Download latest</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Versions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Versions</h2>
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
                <div className="text-sm text-slate-700">
                  v{v.version_number} • {v.uploaded_by_name ?? "Unknown"} • {v.uploaded_at ? new Date(v.uploaded_at).toLocaleString() : ""}
                </div>
                <Button onClick={() => onDownload(v.version_number)}>Download</Button>
              </div>
            ))}
          </div>
          {canUploadVersion && (
              <form onSubmit={onUploadNewVersion} className="mt-4 space-y-2">
              <label className="text-sm font-medium text-slate-700">Upload new version</label>
              <input type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm" />
              <Button type="submit" disabled={uploading || !newFile}>{uploading ? "Uploading..." : "Upload"}</Button>
            </form>
          )}
       
        </div>

        {/* Metadata (owner-only on backend; FE shows form always, backend enforces) */}
        {canEditMetadata && (
          <form onSubmit={onSaveMetadata} className="rounded-xl border border-slate-200 bg-white p-4 shadow space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Edit metadata</h2>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <TagMultiSelect value={tags} onChange={setTags} allowCreate />
          <DeptMultiSelect value={deptIds} onChange={setDeptIds} />
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </form>
        )}
       
      </div>
    </div>
  );
}