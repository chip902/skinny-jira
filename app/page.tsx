"use client";

import SignIn from "@/components/SignIn";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-4xl font-bold mb-8">Welcome to JIRA Client App</h1>
			<div className="w-full max-w-md space-y-4">
				<SignIn />
			</div>
		</div>
	);
}
