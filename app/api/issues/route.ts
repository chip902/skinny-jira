// app/api/issues/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { fetchIssues, getAvailableTransitions, transitionIssue, updateIssue } from "@/lib/jira-api";

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

export async function POST(req: NextRequest, { params }: { params: { ticketKey: string } }) {
	try {
		const { transitionId } = await req.json();

		if (!params?.ticketKey || !transitionId) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required parameters",
				},
				{ status: 400 }
			);
		}

		const availableTransitions = await getAvailableTransitions(params.ticketKey);

		if (!availableTransitions.includes(transitionId)) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid transition ID",
				},
				{ status: 400 }
			);
		}

		const result = await transitionIssue(params.ticketKey, transitionId);
		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error transitioning JIRA issue:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to transition JIRA issue",
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
