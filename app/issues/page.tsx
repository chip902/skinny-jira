"use client";

import { useState, useEffect } from "react";
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

interface Issue {
	key: string;
	id: string;
	summary: string;
	description: any;
	status: string;
	created: string;
	updated: string;
}

export default function IssueManagement() {
	const [issues, setIssues] = useState<Issue[]>([]);
	const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
	const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
	const [comments, setComments] = useState<JiraComment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		// Initialize JIRA API when component mounts
		initializeJiraApi(process.env.NEXT_PUBLIC_JIRA_EMAIL!, process.env.NEXT_PUBLIC_JIRA_TOKEN!);
		loadIssues();
	}, []);

	useEffect(() => {
		async function testQuery() {
			try {
				// Use the same project key here
				await testJqlQuery('project = "TADTECHJC"');
				loadIssues();
			} catch (error) {
				console.error("JQL test failed:", error);
				setError("true");
			}
		}
		testQuery();
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
			setSelectedIssue({
				...selectedIssue,
				status: details.fields.status.name,
				description: details.fields.description,
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
											<p className="text-sm text-muted-foreground">{issue.summary}</p>
										</div>
										<span className="px-2 py-1 text-xs rounded-full bg-primary/10">{issue.status}</span>
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
									<h3 className="text-lg font-semibold mb-2">Status: {selectedIssue.status}</h3>
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
									<h3 className="text-lg font-semibold mb-2">Comments</h3>
									<div className="space-y-4 mb-4">
										{comments.map((comment) => (
											<div key={comment.id} className="border-l-2 border-primary/20 pl-4">
												<p className="text-sm text-muted-foreground">
													{comment.author.displayName} - {new Date(comment.created).toLocaleString()}
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
