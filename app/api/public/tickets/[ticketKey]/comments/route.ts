// app/api/public/tickets/[ticketKey]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

/** Helper to create an Axios client with your credentials. */
function createJiraClient() {
	const jiraUrl = process.env.NEXT_PUBLIC_JIRA_URL?.trim();
	const email = process.env.NEXT_PUBLIC_JIRA_EMAIL?.trim();
	const apiToken = process.env.JIRA_API_TOKEN?.trim();

	if (!jiraUrl || !email || !apiToken) {
		throw new Error("Missing JIRA configuration");
	}

	const base64Auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

	return axios.create({
		baseURL: jiraUrl,
		headers: {
			Authorization: `Basic ${base64Auth}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
}

/**
 * POST /api/public/tickets/[ticketKey]/comments?email=someuser@example.com
 * {
 *    "comment": "This is my new comment"
 * }
 */
export async function POST(req: Request, { params }: { params: { ticketKey: string } }) {
	const { ticketKey } = params;
	if (!ticketKey) {
		return NextResponse.json({ error: "Missing ticketKey" }, { status: 400 });
	}

	const { searchParams } = new URL(req.url);
	const email = searchParams.get("email");
	if (!email) {
		return NextResponse.json({ error: "Email query param is required" }, { status: 400 });
	}

	try {
		const { comment } = await req.json();
		if (!comment || typeof comment !== "string") {
			return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
		}

		const jira = createJiraClient();
		// 1) First verify the user has permission to comment on this ticket:
		//    fetch the ticket, check if it "belongs" to them
		try {
			const issueResp = await jira.get(`/rest/api/2/issue/${ticketKey}`, {
				params: { fields: "summary,reporter,description" },
			});
			const fields = issueResp.data?.fields || {};
			const summary = fields.summary || "";
			const desc = fields.description || "";
			// For example, check if summary/desc contains user’s email:
			const isOwner = summary.includes(email) || desc.includes(email);
			// Or if you really are setting reporter = <that email> in JIRA, check:
			// const isOwner = (fields.reporter?.emailAddress || "").toLowerCase() === email.toLowerCase();

			if (!isOwner) {
				return NextResponse.json({ error: "You do not have permission to comment on this ticket" }, { status: 403 });
			}
		} catch (issueCheckError: any) {
			console.error("Error verifying ticket owner:", issueCheckError?.response?.data || issueCheckError);
			return NextResponse.json({ error: "Failed to verify ticket ownership" }, { status: 500 });
		}

		// 2) Post the comment as you (the authenticated user)
		const commentBody = {
			body: {
				type: "doc",
				version: 1,
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: comment }],
					},
				],
			},
		};

		const response = await jira.post(`/rest/api/2/issue/${ticketKey}/comment`, commentBody);

		return NextResponse.json({
			success: true,
			commentId: response.data.id,
			created: response.data.created,
			author: response.data.author?.displayName || "Unknown User",
		});
	} catch (error: any) {
		console.error("Error adding comment:", error?.response?.data || error.message);

		if (axios.isAxiosError(error)) {
			return NextResponse.json(
				{
					error: "Failed to add comment",
					details: error.response?.data?.errorMessages || [error.message],
				},
				{ status: error.response?.status || 500 }
			);
		}

		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
