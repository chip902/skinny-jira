"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function ClientLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	useEffect(() => {
		// Verify token on initial load
		fetch("/api/validate-token").catch((error) => {
			router.push("/landing");
		});
	}, [router]);
	return (
		<div className="app-container">
			<main className="content-container">{children}</main>
		</div>
	);
}
