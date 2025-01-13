import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const createJiraClient = () => {
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
};

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const email = searchParams.get("email");

		if (!email) {
			return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
		}

		const jiraClient = createJiraClient();

		const jql = `reporter = "${email}"`;
		console.log("Executing JQL query:", jql);

		const response = await jiraClient.get("/rest/api/2/search", {
			params: {
				jql,
				fields: "summary,description,status,created,updated,comment",
				maxResults: 50,
			},
		});

		// Simplified ticket mapping with null checks
		const tickets = (response.data.issues || []).map((issue: any) => ({
			key: issue.key || "",
			summary: issue.fields?.summary || "",
			status: issue.fields?.status?.name || "Unknown",
			created: issue.fields?.created || new Date().toISOString(),
			updated: issue.fields?.updated || new Date().toISOString(),
			comments: (issue.fields?.comment?.comments || []).map((comment: any) => ({
				id: comment.id || "",
				body: {
					content: [
						{
							content: [
								{
									text: comment.body || "No content available",
								},
							],
						},
					],
				},
				author: {
					displayName: comment.author?.displayName || "Unknown User",
				},
				created: comment.created || new Date().toISOString(),
			})),
		}));

		return NextResponse.json(tickets);
	} catch (error) {
		console.error("Error in /api/public/tickets:", error);

		if (axios.isAxiosError(error)) {
			console.error("JIRA API Error:", {
				status: error.response?.status,
				data: error.response?.data,
			});

			return NextResponse.json(
				{
					error: "Failed to fetch tickets",
					details: error.response?.data?.errorMessages || [error.message],
				},
				{ status: error.response?.status || 500 }
			);
		}

		return NextResponse.json(
			{
				error: "An unexpected error occurred",
			},
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const { summary, description, email } = await req.json();

		if (!summary || !description || !email) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const jiraClient = createJiraClient();

		const createResponse = await jiraClient.post("/rest/api/2/issue", {
			fields: {
				project: {
					key: process.env.JIRA_PROJECT_KEY,
				},
				summary,
				description: {
					type: "doc",
					version: 1,
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: description }],
						},
					],
				},
				issuetype: {
					name: "Task", // or whatever issue type you want to use
				},
				reporter: {
					emailAddress: email,
				},
			},
		});

		const issueKey = createResponse.data.key;

		// Add watcher
		try {
			await jiraClient.post(`/rest/api/2/issue/${issueKey}/watchers`, `"${email}"`, {
				headers: {
					"Content-Type": "application/json",
				},
			});
		} catch (watcherError) {
			console.error("Failed to add watcher, but ticket was created:", watcherError);
		}

		return NextResponse.json({ key: issueKey });
	} catch (error) {
		console.error("Error creating ticket:", error);

		if (axios.isAxiosError(error)) {
			return NextResponse.json(
				{
					error: "Failed to create ticket",
					details: error.response?.data?.errorMessages || [error.message],
				},
				{ status: error.response?.status || 500 }
			);
		}

		return NextResponse.json(
			{
				error: "An unexpected error occurred",
			},
			{ status: 500 }
		);
	}
}
