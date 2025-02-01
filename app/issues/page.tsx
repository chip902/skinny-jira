// app/issues/page.tsx
"use client";
export const dynamic = "error";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	fetchIssues,
	getAvailableTransitions,
	transitionIssue,
	addComment,
	getComments,
	getIssueDetails,
	WorkflowTransition,
	JiraComment,
	testJqlQuery,
	initializeJiraApi,
} from "@/lib/jira-api";
import { JiraIssue } from "@/types/jira";

function DateDisplay({ isoString }: { isoString: string }) {
	const [formatted, setFormatted] = useState("");

	useEffect(() => {
		setFormatted(new Date(isoString).toLocaleString());
	}, [isoString]);

	return <span>{formatted || "Loading date..."}</span>;
}

export default function IssueManagement() {
	const [issues, setIssues] = useState<JiraIssue[]>([]);
	const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
	const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
	const [comments, setComments] = useState<JiraComment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		async function onMount() {
			// init JIRA
			initializeJiraApi(process.env.NEXT_PUBLIC_JIRA_EMAIL!, process.env.NEXT_PUBLIC_JIRA_TOKEN!);

			// test query
			await testJqlQuery('project = "TADTECHJC"');
			// then load issues
			await loadIssues();
		}

		onMount().catch((err) => console.error(err));
	}, []);
	useEffect(() => {
		if (selectedIssue) {
			loadIssueDetails();
		}
	}, [selectedIssue?.key]);

	const loadIssues = async () => {
		try {
			setLoading(true);
			setError(""); // Clear any previous errors
			const fetchedIssues = await fetchIssues();
			setIssues(fetchedIssues);
		} catch (error: any) {
			setError(error.response?.data?.message || "Failed to load issues");
			console.error("Error loading issues:", error.response?.data || error);
		} finally {
			setLoading(false);
		}
	};

	const loadIssueDetails = async () => {
		if (!selectedIssue) return;

		try {
			setLoading(true);
			const [transitionsData, commentsData, details] = await Promise.all([
				getAvailableTransitions(selectedIssue.key),
				getComments(selectedIssue.key),
				getIssueDetails(selectedIssue.key),
			]);

			setTransitions(transitionsData);
			setComments(commentsData);
			setSelectedIssue((prevState) => {
				if (!details) {
					return prevState;
				}
				const newIssue = {
					id: details.id,
					key: details.key,
					fields: {
						assignee: details.fields.assignee,
						comment: details.fields.comment,
						summary: details.fields.summary,
						description: details.fields.description,
						status: {
							name: details.status?.name || "Not Available",
						},
						created: details.fields.created,
						updated: details.fields.updated,
					},
				};

				return prevState ? { ...prevState, ...newIssue } : newIssue;
			});
		} catch (error) {
			setError("Failed to load issue details");
			console.error("Error loading issue details:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleTransition = async (transitionId: string) => {
		if (!selectedIssue) return;

		try {
			setLoading(true);
			await transitionIssue(selectedIssue.key, transitionId);
			await loadIssueDetails();
			await loadIssues(); // Refresh the full list
		} catch (error) {
			setError("Failed to transition issue");
			console.error("Error transitioning issue:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddComment = async () => {
		if (!selectedIssue || !newComment.trim()) return;

		try {
			setLoading(true);
			await addComment(selectedIssue.key, newComment);
			setNewComment("");
			await loadIssueDetails();
		} catch (error) {
			setError("Failed to add comment");
			console.error("Error adding comment:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6">Issue Management</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Issues</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{issues.map((issue) => (
								<div
									key={issue.id}
									className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedIssue?.id === issue.id ? "bg-accent" : ""}`}
									onClick={() => setSelectedIssue(issue)}>
									<div className="flex justify-between items-center">
										<div>
											<p className="font-medium">{issue.key}</p>
											<p className="text-sm text-muted-foreground">{issue.fields.summary}</p>
										</div>
										<span className="px-2 py-1 text-xs rounded-full bg-primary/10">{issue.fields.status.name}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{selectedIssue && (
					<Card>
						<CardHeader>
							<CardTitle>Issue Details: {selectedIssue.key}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								<div>
									<h3 className="text-lg font-semibold mb-2">Status: {}</h3>
									{transitions.length > 0 && (
										<div className="flex gap-2">
											{transitions.map((transition) => (
												<Button
													key={transition.id}
													variant="outline"
													onClick={() => handleTransition(transition.id)}
													disabled={loading}>
													{transition.name}
												</Button>
											))}
										</div>
									)}
								</div>

								<div>
									<h3 className="text-lg font-semibold mb-2">Summary</h3>
									<p className="text-sm text-muted-foreground">{selectedIssue.fields.summary}</p>
								</div>
								<div>
									<h3 className="text-lg font-semibold mb-2">Assigned To</h3>
									<p className="text-sm text-muted-foreground">{selectedIssue.fields.assignee.displayName}</p>
								</div>
								<div>
									<h3 className="text-lg font-semibold mb-2">Created</h3>
									<p className="text-sm text-muted-foreground">{format(new Date(selectedIssue.fields.created), "yyyy-MM-dd HH:mm:ss")}</p>
								</div>

								<div>
									<h3 className="text-lg font-semibold mb-2">Updated</h3>
									<p className="text-sm text-muted-foreground">{format(new Date(selectedIssue.fields.updated), "yyyy-MM-dd HH:mm:ss")}</p>
								</div>
								<div>
									<h3 className="text-lg font-semibold mb-2">Comments</h3>
									<div className="space-y-4 mb-4">
										{comments.map((comment) => (
											<div key={comment.id} className="border-l-2 border-primary/20 pl-4">
												<p className="text-sm text-muted-foreground">
													{comment.author.displayName} - {format(new Date(comment.created), "yyyy-MM-dd HH:mm:ss")}
												</p>
												<p className="mt-1">{comment.body.content[0].content[0].text}</p>
											</div>
										))}
									</div>

									<div className="space-y-2">
										<Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
										<Button onClick={handleAddComment} disabled={loading || !newComment.trim()}>
											Add Comment
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{error && <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
		</div>
	);
}
