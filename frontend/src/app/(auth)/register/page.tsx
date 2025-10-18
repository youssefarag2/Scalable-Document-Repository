"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import FormCard from "@/components/ui/FormCard";
import { getDepartments, registerUser } from "@/lib/api";
import type { AxiosError } from "axios";

export default function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [departmentId, setDepartmentId] = useState<string>("");
	const [role, setRole] = useState("employee");
	const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [confirmError, setConfirmError] = useState<string | null>(null);

	useEffect(() => {
		getDepartments().then(setDepartments).catch(() => setDepartments([]));
	}, []);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setConfirmError(null);

		if (password !== confirmPassword) {
			setConfirmError("Passwords do not match");
			return;
		}

		setLoading(true);
		try {
			await registerUser({
				name,
				email,
				password,
				department_id: departmentId ? Number(departmentId) : null,
				role,
			});
			router.push("/login");
		} catch (e) {
			const err = e as AxiosError<{ detail?: string }>;
			setError(err.response?.data?.detail ?? err.message ?? "Registration failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<FormCard title="Create your account" subtitle="Join the organization’s document repository">
			<form onSubmit={onSubmit} className="space-y-4">
				<Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
				<Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				<Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				<Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={confirmError || undefined} required />
				<Select
					label="Department"
					value={departmentId}
					onChange={(e) => setDepartmentId(e.target.value)}
					options={[{ label: "Select department", value: "" }, ...departments.map(d => ({ label: d.name, value: d.id }))]}
				/>
				<Select
					label="Role"
					value={role}
					onChange={(e) => setRole(e.target.value)}
					options={[
						{ label: "Employee", value: "employee" },
						{ label: "Manager", value: "manager" },
					]}
				/>
				{error ? <p className="text-sm text-red-600">{error}</p> : null}
				<Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
				<p className="text-sm text-slate-600">
					Already have an account?{" "}
					<Link className="text-blue-600 hover:underline" href="/login">Login</Link>
				</p>
			</form>
		</FormCard>
	);
}