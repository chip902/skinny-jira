"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createPublicTicket, fetchIssues } from "@/lib/jira-api";
import { useState } from "react";

export default function Home() {
	const [summary, setSummary] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submissionError, setSubmissionError] = useState("");
	const [userEmail, setUserEmail] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		try {
			setSubmitting(true);
			const key = await createPublicTicket(summary, description, userEmail || "");
			console.log("Ticket created successfully", key);
			fetchIssues();
		} catch (error) {
			setSubmissionError("Failed to submit the ticket");
			console.error(error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-background">
			<h1 className="text-4xl font-bold mb-8">Welcome to JIRA Client App</h1>
			<div className="space-x-4">
				<form onSubmit={handleSubmit} className="space-y-4">
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Enter your email"
						className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					{error && <p className="text-red-500">{error}</p>}
					<button type="submit" className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200">
						Get Started
					</button>
				</form>
			</div>
		</div>
	);
}
