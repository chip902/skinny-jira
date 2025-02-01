// components/PublicPortal.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createPublicTicket, getPublicTicketStatus, PublicTicket, addComment } from "@/lib/jira-api";

export default function PublicPortal() {
	const [newTicket, setNewTicket] = useState({
		summary: "",
		description: "",
		email: "",
	});
	const [ticketKey, setTicketKey] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [ticketDetails, setTicketDetails] = useState<PublicTicket | null>(null);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [newComment, setNewComment] = useState("");

	const handleSubmitTicket = async () => {
		try {
			setError("");
			setSuccess("");

			if (!newTicket.summary || !newTicket.description || !newTicket.email) {
				setError("Please fill in all fields");
				return;
			}

			const key = await createPublicTicket(newTicket.summary, newTicket.description, newTicket.email);

			setSuccess(`Ticket created successfully! Your ticket number is: ${key}`);
			setNewTicket({ summary: "", description: "", email: "" });
			setTicketKey(key);
		} catch (error) {
			setError("Failed to create ticket. Please try again later.");
		}
	};

	const handleCheckStatus = async () => {
		try {
			setError("");
			setTicketDetails(null);

			if (!ticketKey || !searchEmail) {
				setError("Please enter both ticket number and email");
				return;
			}

			const details = await getPublicTicketStatus(ticketKey, searchEmail);
			setTicketDetails(details);
		} catch (error) {
			setError("Failed to fetch ticket details. Please verify your information.");
		}
	};

	const loadTicketDetails = async (email: string) => {
		try {
			const details = await getPublicTicketStatus(ticketKey, email);
			setTicketDetails(details);
		} catch (error) {
			setError("Failed to refresh ticket details");
		}
	};

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (!ticketKey || !newComment) return;

			await addComment(ticketKey, newComment);
			setNewComment("");
			toast.success("Comment added successfully!");
			loadTicketDetails(searchEmail); // Refresh ticket details
		} catch (error) {
			console.error("Error adding comment:", error);
			setError("Failed to add comment");
		}
	};

	return (
		<div className="container mx-auto p-4">
			<h1 className="text-3xl font-bold mb-6">Support Portal</h1>

			<Tabs defaultValue="submit" className="space-y-4">
				<TabsList>
					<TabsTrigger value="submit">Submit New Ticket</TabsTrigger>
					<TabsTrigger value="check">Check Ticket Status</TabsTrigger>
				</TabsList>

				<TabsContent value="submit">
					<Card>
						<CardHeader>
							<CardTitle>Submit New Support Ticket</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<Label htmlFor="email">Email Address</Label>
									<Input
										id="email"
										type="email"
										value={newTicket.email}
										onChange={(e) => setNewTicket({ ...newTicket, email: e.target.value })}
										placeholder="Enter your email"
									/>
								</div>
								<div>
									<Label htmlFor="summary">Summary</Label>
									<Input
										id="summary"
										value={newTicket.summary}
										onChange={(e) => setNewTicket({ ...newTicket, summary: e.target.value })}
										placeholder="Brief summary of your issue"
									/>
								</div>
								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={newTicket.description}
										onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
										placeholder="Detailed description of your issue"
										rows={5}
									/>
								</div>
								<Button onClick={handleSubmitTicket}>Submit Ticket</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="check">
					<Card>
						<CardHeader>
							<CardTitle>Check Ticket Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<Label htmlFor="ticketNumber">Ticket Number</Label>
									<Input
										id="ticketNumber"
										value={ticketKey}
										onChange={(e) => setTicketKey(e.target.value)}
										placeholder="Enter your ticket number"
									/>
								</div>
								<div>
									<Label htmlFor="searchEmail">Email Address</Label>
									<Input
										id="searchEmail"
										type="email"
										value={searchEmail}
										onChange={(e) => setSearchEmail(e.target.value)}
										placeholder="Enter your email"
									/>
								</div>
								<Button onClick={handleCheckStatus}>Check Status</Button>

								{ticketDetails && (
									<div className="mt-6 space-y-4">
										<h3 className="text-lg font-semibold">Ticket Details</h3>
										<div className="grid grid-cols-2 gap-2">
											<div>Status:</div>
											<div>{ticketDetails.status}</div>
											<div>Created:</div>
											<div>{new Date(ticketDetails.created).toLocaleString()}</div>
											<div>Last Updated:</div>
											<div>{new Date(ticketDetails.updated).toLocaleString()}</div>
										</div>

										<div className="mt-4">
											<h4 className="font-semibold">Comments:</h4>
											{ticketDetails.comments.length > 0 ? (
												<ul className="space-y-2">
													{ticketDetails.comments.map((comment) => (
														<li key={comment.id} className="border-l-2 border-gray-200 pl-4">
															<p className="text-sm text-gray-500">
																{comment.author.displayName} - {new Date(comment.created).toLocaleString()}
															</p>
															<p>{comment.body.content[0].content[0].text}</p>
														</li>
													))}
												</ul>
											) : (
												<p>No comments yet</p>
											)}
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{error && (
				<Alert variant="destructive" className="mt-4">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="mt-4">
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
