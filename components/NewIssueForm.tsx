// components/NewIssueForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { handleApiResponse } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ToastMessage } from "./ui/toast-messages";

export function NewIssueForm() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);

		try {
			const formData = new FormData(e.currentTarget);
			const response = await fetch("/api/issues", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					summary: formData.get("summary"),
					description: formData.get("description"),
				}),
			});

			const data = await handleApiResponse(response);

			if (data.success) {
				toast({
					variant: "default",
					children: ToastMessage({
						title: "Issue Created",
						description: "Your issue has been successfully created.",
					}),
				});
				// Handle success (e.g., redirect or clear form)
			}
		} catch (error) {
			// Error toast is already shown by handleApiResponse
			console.error("Form submission error:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Create New Issue</CardTitle>
				<CardDescription>Enter the details for your new issue.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<label htmlFor="summary" className="text-sm font-medium">
							Summary
						</label>
						<Input id="summary" name="summary" required placeholder="Brief summary of the issue" />
					</div>

					<div className="space-y-2">
						<label htmlFor="description" className="text-sm font-medium">
							Description
						</label>
						<Textarea id="description" name="description" required placeholder="Detailed description of the issue" rows={5} />
					</div>

					<div className="flex justify-end space-x-2">
						<Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create Issue"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
