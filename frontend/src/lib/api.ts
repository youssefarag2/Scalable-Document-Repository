import axios  from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({baseURL})


api.interceptors.request.use((config) => {
	if (typeof window !== "undefined") {
		const token = localStorage.getItem("access_token");
		if (token) config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});


export type DocSummary = {
	id: number;
	title: string;
	current_version_number: number;
	tags: string[];
	updated_at?: string | null;
	description?: string; // for convenience on FE (when available)
};

export type VersionInfo = {
	id: number;
	version_number: number;
	uploaded_by_name?: string | null;
	uploaded_at?: string | null;
	file_size?: number | null;
	mime_type?: string | null;
};



export async function login(email: string, password: string) {
    const res = await api.post("/api/auth/login", {email, password})
    return res.data as {access_token: string; token_type: string}
}

export async function registerUser(payload: {
    name : string;
    email: string;
    password: string;
    department_id: number | null;
    role?: string | null;
}) {
    const res = await api.post("/api/auth/register", payload)
    return res.data;
}

export async function getDepartments() {
    const res = await api.get("/api/departments")
    return res.data as Array<{id: number; name: string}>;
}



export async function listAccessibleDocs() {
	const res = await api.get("/api/documents");
	return res.data as DocSummary[];
}

export async function searchDocuments(params: {
	title?: string;
	description?: string;
	tagsCsv?: string; // "HR,Policy"
	version?: number;
}) {
	const q = new URLSearchParams();
	if (params.title) q.set("title", params.title);
	if (params.description) q.set("description", params.description);
	if (params.tagsCsv) q.set("tags", params.tagsCsv);
	if (params.version) q.set("version", String(params.version));
	const res = await api.get(`/api/documents/search?${q.toString()}`);
	return res.data as DocSummary[];
}

export async function getVersions(documentId: number) {
	const res = await api.get(`/api/documents/${documentId}/versions`);
	return res.data as VersionInfo[];
}

export async function downloadLatest(documentId: number) {
	const res = await api.get(`/api/documents/${documentId}/download?version=latest`, {
		responseType: "blob",
	});
	const disp = res.headers["content-disposition"] as string | undefined;
	let filename = "download";
	if (disp) {
		const m = /filename="?([^"]+)"?/i.exec(disp);
		if (m?.[1]) filename = m[1];
	}
	return { blob: res.data as Blob, filename };
}
export async function getTags() {
    const res = await api.get("/api/tags");
    return res.data as Array<{ id: number; name: string }>;
  }

export async function listMyDocs() {
    const res = await api.get("/api/users/me/documents");
    return res.data as DocSummary[];
}
  
export async function uploadDocument(form: FormData) {
    const res = await api.post("/api/documents/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as DocSummary;
}

export async function getDocument(id: number) {
	const res = await api.get(`/api/documents/${id}`);
	return res.data as { id: number; title: string; description?: string; current_version_number: number; tags: string[]; owner_id?: number };
  }
  
export async function downloadVersion(documentId: number, version: number | "latest") {
	const res = await api.get(`/api/documents/${documentId}/download?version=${version}`, { responseType: "blob" });
	const disp = res.headers["content-disposition"] as string | undefined;
	let filename = "download";
	if (disp) { const m = /filename="?([^"]+)"?/i.exec(disp); if (m?.[1]) filename = m[1]; }
	return { blob: res.data as Blob, filename };
}
  
export async function uploadNewVersion(documentId: number, file: File) {
	const fd = new FormData();
	fd.append("file", file);
	const res = await api.post(`/api/documents/${documentId}/version`, fd, { headers: { "Content-Type": "multipart/form-data" } });
	return res.data;
}
  
export async function updateDocument(id: number, payload: { title?: string; description?: string; tags?: string[]; permission_department_ids?: number[] }) {
	const res = await api.put(`/api/documents/${id}`, payload);
	return res.data;
}