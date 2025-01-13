import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const jiraApi = axios.create({
	baseURL: process.env.NEXT_PUBLIC_JIRA_URL || "",
});

export const setJiraAuthHeader = (apiToken: string) => {
	jiraApi.defaults.headers.Authorization = `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${apiToken}`).toString("base64")}`;
};

export const removeJiraAuthHeader = () => {
	delete jiraApi.defaults.headers.Authorization;
};

const jiraRequestHandler = async (options: { method: string; url: string; data?: any }) => {
	if (!jiraApi.defaults.headers.Authorization) {
		throw new Error("JIRA API token not set");
	}

	try {
		const response = await jiraApi[options.method](options.url, options.data);
		return response.data;
	} catch (error) {
		console.error("Error in JIRA request:", error);
		if (axios.isAxiosError(error)) {
			console.error("Full error response:", error.response?.data);
			throw new Error(error.message);
		}
		throw new Error("Unknown error");
	}
};

export const fetchIssues = async () => jiraRequestHandler({ method: "GET", url: "/rest/api/2/search" });

// Add other JIRA API functions as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	const { method } = req;
	const email = req.headers["x-jira-email"] || "";

	try {
		switch (method) {
			case "GET":
				setJiraAuthHeader(process.env.NEXT_PUBLIC_JIRA_API_TOKEN!); // Add this line to set the JIRA API token as an Authorization header
				const tickets = await fetchIssues();
				return res.status(200).json(tickets);
			case "POST":
				setJiraAuthHeader(process.env.NEXT_PUBLIC_JIRA_API_TOKEN!); // Add this line to set the JIRA API token as an Authorization header
				const { summary, description } = req.body;
				if (!summary || !description) {
					return res.status(400).json({ error: "Missing required fields" });
				}

				const response = await axios.post(`${process.env.NEXT_PUBLIC_JIRA_URL}/rest/api/2/issue`, {
					fields: {
						project: { key: process.env.JIRA_PROJECT_KEY?.trim() },
						summary: summary,
						description: description,
						issuetype: { name: "Support Request" },
						reporter: { name: email || "" },
					},
				});

				return res.status(201).json({ key: response.data.key });
			default:
				return res.setHeader("Allow", ["GET", "POST"]).status(405).end(`Method ${method} Not Allowed`);
		}
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error("Response data:", error.response?.data);
			const errorDetail = error.response?.data?.errors?.[0]?.message || error.message;
			return res.status(500).json({ error: "Failed to process request", details: errorDetail });
		}
		console.error("Error processing request:", error);
		return res.status(500).json({ error: "Internal server error" });
	} finally {
		removeJiraAuthHeader(); // Add this line to remove the JIRA API token after the request is complete
	}
}
