import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
	const JIRA_URL = process.env.NEXT_PUBLIC_JIRA_URL;
	const JIRA_EMAIL = process.env.NEXT_PUBLIC_JIRA_EMAIL;
	const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

	if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
		return NextResponse.json({ error: "JIRA configuration missing" }, { status: 500 });
	}

	const jiraClient = axios.create({
		baseURL: JIRA_URL,
		headers: {
			Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});

	try {
		const response = await jiraClient.get("/rest/api/2/search", {
			params: {
				jql: "project = TADTECHJC ORDER BY created DESC",
				fields: "summary,description,status,created,updated",
			},
		});

		const issues = response.data.issues.map((issue: any) => ({
			id: issue.id,
			key: issue.key,
			summary: issue.fields.summary,
			description: issue.fields.description,
			status: issue.fields.status.name,
			created: issue.fields.created,
			updated: issue.fields.updated,
		}));

		return NextResponse.json(issues);
	} catch (error) {
		console.error("Error fetching JIRA issues:", error);
		return NextResponse.json({ error: "Failed to fetch issues from JIRA" }, { status: 500 });
	}
}
