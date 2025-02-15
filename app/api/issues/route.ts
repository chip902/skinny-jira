// app/api/issues/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createIssueV3, fetchIssues, getAvailableTransitions, transitionIssue, updateIssue } from "@/lib/jira-api";

export async function GET() {
	try {
		const issues = await fetchIssues();
		return new Response(JSON.stringify(issues), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("Failed to fetch issues:", error);
		return new Response(JSON.stringify({ error: "Failed to fetch issues" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		// If we have a ticketKey, we're transitioning an existing issue
		if (body.ticketKey && body.transitionId) {
			const availableTransitions = await getAvailableTransitions(body.ticketKey);

			if (!availableTransitions.includes(body.transitionId)) {
				return NextResponse.json(
					{
						success: false,
						error: "Invalid transition ID",
					},
					{ status: 400 }
				);
			}

			const result = await transitionIssue(body.ticketKey, body.transitionId);
			return NextResponse.json({
				success: true,
				data: result,
			});
		}

		// If we don't have a ticketKey, we're creating a new issue
		if (body.summary && body.description) {
			const result = await createIssueV3({
				summary: body.summary,
				description: body.description,
				issueType: body.issueType,
				priority: body.priority,
				assignee: body.assignee,
			});

			return NextResponse.json({
				success: true,
				data: result,
			});
		}

		return NextResponse.json(
			{
				success: false,
				error: "Invalid request parameters",
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error handling JIRA issue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to process JIRA issue",
				details: axios.isAxiosError(error) ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function PUT(req: NextRequest, { params }: { params: { ticketKey: string } }) {
	try {
		const updates = await req.json();

		if (!params?.ticketKey || !updates) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required parameters",
				},
				{ status: 400 }
			);
		}

		// Update issue logic here
		const result = await updateIssue(params.ticketKey, updates);
		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error updating JIRA issue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update JIRA issue",
				details: axios.isAxiosError(error) ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
