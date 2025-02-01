// app/api/public/tickets/[ticketKey]/route.ts
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
 * GET /api/public/tickets/[ticketKey]?email=someuser@example.com
 *
 * Retrieves a single ticket and checks if it "belongs" to that email.
 * The check can be by reporter.emailAddress OR by scanning the summary/description
 * for the user’s email. Adjust as needed.
 */
export async function GET(req: NextRequest, { params }: { params: { ticketKey: string } }) {
	const ticketKey = params.ticketKey;
	if (!ticketKey) {
		return NextResponse.json({ error: "Missing ticketKey in URL" }, { status: 400 });
	}

	const { searchParams } = new URL(req.url);
	const email = searchParams.get("email");
	if (!email) {
		return NextResponse.json({ error: "Email query parameter is required" }, { status: 400 });
	}

	try {
		const jira = createJiraClient();
		// Fetch issue details, including comments
		const response = await jira.get(`/api/proxy/rest/api/2/issue/${ticketKey}`, {
			params: {
				fields: "summary,description,status,created,updated,comment,reporter",
			},
		});

		const issue = response.data;
		const fields = issue.fields || {};

		// Extract relevant fields
		const statusName = fields.status?.name || "Unknown";
		const summary = fields.summary || "";
		const description = fields.description || "";
		const reporterEmail = fields.reporter?.emailAddress || "";
		const created = fields.created || "";
		const updated = fields.updated || "";

		// Check ownership:
		//  1) If you are actually setting `reporter: { emailAddress: <theUser> }`, compare directly
		//  2) Or if you are storing user’s email in summary/description, check includes() instead
		let belongsToUser = false;

		// Example #1: If you're forcibly setting reporter to your "public user"
		// or always setting reporter as yourself, we can't rely on reporterEmail.
		// So let's see if the summary or description contains the email:
		if (summary.includes(email) || description.includes(email)) {
			belongsToUser = true;
		}

		// Example #2: If you're actually setting reporter = user’s email (and user is licensed):
		// if (reporterEmail.toLowerCase() === email.toLowerCase()) {
		//   belongsToUser = true;
		// }

		if (!belongsToUser) {
			return NextResponse.json({ error: "You do not have permission to view this ticket" }, { status: 403 });
		}

		// Build the shape your front-end expects
		const comments =
			fields.comment?.comments?.map((comment: any) => ({
				id: comment.id,
				body: comment.body,
				author: {
					displayName: comment.author?.displayName ?? "Unknown User",
				},
				created: comment.created,
			})) || [];

		const result = {
			key: ticketKey,
			summary,
			status: statusName,
			created,
			updated,
			// If `description` is an Atlassian "rich text" object, adapt it to your front-end
			description,
			comments,
		};

		return NextResponse.json(result);
	} catch (error: any) {
		console.error("Error fetching ticket details:", error?.response?.data || error.message);

		if (axios.isAxiosError(error)) {
			return NextResponse.json(
				{
					error: "Failed to fetch ticket details",
					details: error.response?.data?.errorMessages || [error.message],
				},
				{ status: error.response?.status || 500 }
			);
		}

		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
