"use client";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { data: session, status } = useSession();

	useEffect(() => {
		if (status === "loading") return;

		if (status === "unauthenticated" && pathname !== "/") {
			router.push("/");
		}

		if (status === "authenticated" && pathname === "/") {
			router.push("/issues");
		}
	}, [status, router, pathname]);

	// Show loading state
	if (status === "loading") {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Navigation />
			<main className="container mx-auto py-6">{children}</main>
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
