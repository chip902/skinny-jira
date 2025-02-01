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
	if (!jiraApi.defaults.headers.Authorization) {
		throw new Error("JIRA API token not set");
	}
	return jiraApi(config);
};

export const fetchIssues = async () =>
	requestHandler({
		method: "GET",
		url: "/rest/api/2/search",
		params: { jql: `reporter = "${process.env.NEXT_PUBLIC_JIRA_EMAIL}"`, fields: "summary,description,status,created,updated,comment,reporter" },
	});

// Add other JIRA API functions as needed
