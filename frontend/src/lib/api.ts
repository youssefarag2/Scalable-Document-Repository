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