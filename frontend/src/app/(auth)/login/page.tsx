"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FormCard from "@/components/ui/FormCard";
import { login } from "@/lib/api";
import type { AxiosError } from "axios";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const { access_token } = await login(email, password);
			localStorage.setItem("access_token", access_token);
			router.push("/");
		} catch (e) {
			const err = e as AxiosError<{ detail?: string }>;
			setError(err.response?.data?.detail ?? err.message ?? "Login failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<FormCard title="Welcome back" subtitle="Sign in to continue">
                  <div className="flex items-center gap-3 mb-2">
        <Image
          src="/files-repo.png"
          alt="Files Repo"
          width={40}
          height={40}
          className="rounded"
          priority
        />
        <span className="text-lg font-semibold text-slate-900">Document Repository</span>
      </div>
			<form onSubmit={onSubmit} className="space-y-4">
				<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				<Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				{error ? <p className="text-sm text-red-600">{error}</p> : null}
				<Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
				<p className="text-sm text-slate-600">
					Don&apos;t have an account?{" "}
					<Link className="text-blue-600 hover:underline" href="/register">Register</Link>
				</p>
			</form>
		</FormCard>
	);
} 