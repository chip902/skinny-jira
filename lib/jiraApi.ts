// lib/jiraApi.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const jiraApi = axios.create({
	baseURL: process.env.NEXT_PUBLIC_JIRA_URL || "",
});

export const setJiraAuthHeader = (apiToken: string) => {
	jiraApi.defaults.headers.Authorization = `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${apiToken}`).toString("base64")}`;
};

export const removeJiraAuthHeader = () => {
	delete jiraApi.defaults.headers.Authorization;
};

const requestHandler = async (config: AxiosRequestConfig) => {
	try {
		if (!jiraApi.defaults.headers.Authorization) {
			throw new Error("JIRA API token not set");
		}
		const response = await jiraApi(config);
		return response.data;
	} catch (error) {
		if (error instanceof AxiosError) {
			console.error("API request failed:", error.message);
			throw error;
		} else {
			console.error("Unexpected error:", error);
			throw error;
		}
	}
};

export const fetchIssues = async () =>
	requestHandler({
		method: "GET",
		url: "/rest/api/2/search",
		params: { jql: `reporter = "${process.env.NEXT_PUBLIC_JIRA_EMAIL}"`, fields: "summary,description,status,created,updated,comment,reporter" },
	});

// Add other JIRA API functions as needed
