"use client";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { data: session, status } = useSession();

	useEffect(() => {
		if (!session?.user?.role) {
			router.push("/");
		}
	}, [router, session]);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/");
		}
	}, [router, status]);
	return (
		<div className="app-container">
			<main className="content-container">{children}</main>
		</div>
	);
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ClientLayoutContent>{children}</ClientLayoutContent>
		</SessionProvider>
	);
}
