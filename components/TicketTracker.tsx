// components/TicketTracker.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { Loader2, RefreshCw } from "lucide-react";
import axios from "axios";
import { JiraTicket, JiraComment } from "@/types/jira";
import { toast } from "sonner";

const formatComment = (comment: JiraComment): string => {
	try {
		if (!comment.body?.content?.[0]?.content?.[0]?.text) {
			return "No comment content";
		}
		return comment.body.content[0].content[0].text;
	} catch (error) {
		return "Unable to display comment content";
	}
};

const TicketTracker = () => {
	const [email, setEmail] = useState("");
	const [tickets, setTickets] = useState<JiraTicket[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchTickets = async () => {
		if (!email) return;

		setLoading(true);

		try {
			const response = await axios.get<JiraTicket[]>("/api/public/tickets", {
				params: { email },
			});

			setTickets(response.data);

			if (response.data.length === 0) {
				toast.info("No tickets found for this email address");
			}
		} catch (err) {
			console.error("Error fetching tickets:", err);
			toast.error("Failed to load tickets. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		fetchTickets();
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Track Your Support Tickets</CardTitle>
				<CardDescription>Enter your email to view all your submitted tickets</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="flex space-x-4 mb-6">
					<Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" required />
					<Button type="submit" disabled={loading || !email}>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
							</>
						) : (
							<>
								<RefreshCw className="mr-2 h-4 w-4" /> Load Tickets
							</>
						)}
					</Button>
				</form>

				{tickets.length > 0 ? (
					<Accordion type="single" collapsible className="w-full">
						{tickets.map((ticket) => (
							<AccordionItem key={ticket.key} value={ticket.key}>
								<AccordionTrigger className="text-left">
									<div>
										<div className="font-medium">{ticket.summary}</div>
										<div className="text-sm text-muted-foreground">
											{ticket.key} - {ticket.status}
										</div>
									</div>
								</AccordionTrigger>
								<AccordionContent>
									<div className="space-y-2">
										<div className="text-sm">
											<span className="font-medium">Created:</span> {format(new Date(ticket.created), "PPpp")}
										</div>
										<div className="text-sm">
											<span className="font-medium">Last Updated:</span> {format(new Date(ticket.updated), "PPpp")}
										</div>
										{(ticket.comments?.length ?? 0) > 0 && (
											<div className="mt-4">
												<h4 className="font-medium mb-2">Comments:</h4>
												<div className="space-y-2">
													{ticket.comments?.map((comment) => (
														<div key={comment.id} className="bg-muted p-2 rounded-md text-sm">
															<div className="font-medium">{comment.author.displayName}</div>
															<div>{formatComment(comment)}</div>
															<div className="text-xs text-muted-foreground mt-1">{format(new Date(comment.created), "PPp")}</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				) : (
					<div className="text-center text-muted-foreground py-8">{email ? "No tickets found" : "Enter your email to view your tickets"}</div>
				)}
			</CardContent>
		</Card>
	);
};

export default TicketTracker;
