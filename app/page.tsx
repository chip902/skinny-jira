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
				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label htmlFor="summary" className="block text-sm font-medium leading-6 text-gray-900">
								Summary
							</label>
							<input
								type="text"
								id="summary"
								value={summary}
								onChange={(e) => setSummary(e.target.value)}
								className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
							/>
						</div>
						<div>
							<label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
								Description
							</label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
								className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
							/>
						</div>
					</div>
					<div className="mt-4">
						<button
							type="submit"
							disabled={submitting}
							className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
							Submit Ticket
						</button>
					</div>
				</form>
			</div>
			<div className="space-x-4">
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/issues">View Issues</Link>
				</Button>
			</div>
		</div>
	);
}
