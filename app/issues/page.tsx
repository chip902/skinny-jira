// app/issues/page.tsx
"use client";
export const dynamic = "error";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import RenderDescription from "@/components/RenderDescription";

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
	const [detailsLoading, setDetailsLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		async function onMount() {
			initializeJiraApi(process.env.NEXT_PUBLIC_JIRA_EMAIL!, process.env.NEXT_PUBLIC_JIRA_TOKEN!);
			await testJqlQuery('project = "TADTECHJC"');
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
			setError("");
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
			setDetailsLoading(true);
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
						status: details.fields.status,
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
			setDetailsLoading(false);
		}
	};

	const handleTransition = async (transitionId: string) => {
		if (!selectedIssue) return;

		try {
			setDetailsLoading(true);
			const response = await fetch(`/api/issues/${selectedIssue.key}/transitions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					transitionId,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to transition issue");
			}

			// Refresh the issue details and list after transition
			await loadIssueDetails();
			await loadIssues();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to transition issue");
			console.error("Error transitioning issue:", error);
		} finally {
			setDetailsLoading(false);
		}
	};

	const handleAddComment = async () => {
		if (!selectedIssue || !newComment.trim()) return;

		try {
			setDetailsLoading(true);
			await addComment(selectedIssue.key, newComment);
			setNewComment("");
			await loadIssueDetails();
		} catch (error) {
			setError("Failed to add comment");
			console.error("Error adding comment:", error);
		} finally {
			setDetailsLoading(false);
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
							{loading ? (
								<>
									{[1, 2, 3].map((i) => (
										<div key={i} className="p-4 border rounded-lg">
											<div className="space-y-2">
												<Skeleton className="h-4 w-[100px]" />
												<Skeleton className="h-4 w-[200px]" />
											</div>
										</div>
									))}
								</>
							) : (
								issues.map((issue) => (
									<div
										key={issue.id}
										className={`p-4 border rounded-lg cursor-pointer hover:bg-accent ${selectedIssue?.id === issue.id ? "bg-accent" : ""}`}
										onClick={() => setSelectedIssue(issue)}>
										<div className="flex justify-between items-center">
											<div>
												{issue.key && (
													<>
														<p className="font-medium">{issue.key}</p>
														<p className="text-sm text-muted-foreground">{issue.fields.summary || "No summary available"}</p>
													</>
												)}
											</div>
											<span className="px-2 py-1 text-xs rounded-full bg-primary/10">
												{issue.fields.status.name || "No status available"}
											</span>
										</div>
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>

				{selectedIssue && (
					<Card>
						<CardHeader>
							<CardTitle>Issue Details: {selectedIssue.key}</CardTitle>
						</CardHeader>
						<CardContent className="sticky">
							{detailsLoading ? (
								<div className="space-y-6">
									<div>
										<Skeleton className="h-6 w-[100px] mb-2" />
										<Skeleton className="h-10 w-full" />
									</div>
									<div>
										<Skeleton className="h-6 w-[100px] mb-2" />
										<Skeleton className="h-4 w-[300px]" />
									</div>
									<div>
										<Skeleton className="h-6 w-[100px] mb-2" />
										<Skeleton className="h-4 w-[200px]" />
									</div>
									<div>
										<Skeleton className="h-6 w-[100px] mb-2" />
										<div className="space-y-2">
											{[1, 2].map((i) => (
												<Skeleton key={i} className="h-20 w-full" />
											))}
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-6">
									<div>
										<h3 className="text-lg font-semibold mb-2">Status: {selectedIssue?.fields?.status?.name}</h3>
										{transitions.length > 0 && (
											<div className="flex gap-2">
												<Select onValueChange={handleTransition}>
													<SelectTrigger>
														<SelectValue placeholder="Change status..." />
													</SelectTrigger>
													<SelectContent>
														<SelectGroup>
															{transitions.map((transition) => (
																<SelectItem key={transition.id} value={transition.id.toString()}>
																	{transition.name}
																</SelectItem>
															))}
														</SelectGroup>
													</SelectContent>
												</Select>
											</div>
										)}
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Summary</h3>
										<p className="text-sm text-muted-foreground">{selectedIssue?.fields?.summary}</p>
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Assigned To</h3>
										<p className="text-sm text-muted-foreground">{selectedIssue.fields?.assignee?.displayName}</p>
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Description</h3>
										<div className="text-sm text-muted-foreground">
											{selectedIssue?.fields?.description ? (
												<RenderDescription content={selectedIssue.fields.description.content} />
											) : (
												"No description available"
											)}
										</div>
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Created</h3>
										<p className="text-sm text-muted-foreground">
											{selectedIssue.fields?.created
												? format(new Date(selectedIssue.fields.created.replace("+0000", "Z")), "yyyy-MM-dd HH:mm:ss")
												: "N/A"}
										</p>
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Updated</h3>
										<p className="text-sm text-muted-foreground">
											{selectedIssue.fields?.updated
												? format(new Date(selectedIssue.fields.updated.replace("+0000", "Z")), "yyyy-MM-dd HH:mm:ss")
												: "N/A"}
										</p>
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">Comments</h3>
										<div className="space-y-4 mb-4">
											{comments.map((comment) => (
												<div key={comment.id} className="border-l-2 border-primary/20 pl-4">
													<p className="text-sm text-muted-foreground">
														{comment?.author.displayName} - {format(new Date(comment?.created), "yyyy-MM-dd HH:mm:ss")}
													</p>
													<p className="mt-1">{comment?.body.content[0].content[0].text}</p>
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
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{error && <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">{error}</div>}
		</div>
	);
}
