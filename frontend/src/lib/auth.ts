import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export type Me = {
	id: number;
	name: string;
	email: string;
	role?: string | null;
	department_id?: number | null;
	department_name?: string | null;
};

export function useAuthRedirect() {
	const router = useRouter();
	const [user, setUser] = useState<Me | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
		if (!token) {
			setLoading(false);
			router.replace("/login");
			return;
		}
		api.get("/api/auth/me")
			.then((res) => setUser(res.data as Me))
			.catch(() => {
				localStorage.removeItem("access_token");
				router.replace("/login");
			})
			.finally(() => setLoading(false));
	}, [router]);

	return { user, loading };
}