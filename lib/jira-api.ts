// lib/jira-api.ts
import { IssueResponse, JiraComment, JiraProject, ProjectResponse, PublicTicket, WorkflowTransition } from "@/types/jira";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders, AxiosResponse } from "axios";

interface CustomAxiosHeaders extends AxiosHeaders {
	Authorization?: string;
}

const jiraApi: AxiosInstance = axios.create({
	baseURL: "",
});

(jiraApi.defaults.headers as unknown) = {
	"X-Requested-With": "XMLHttpRequest",
} as unknown as CustomAxiosHeaders;

export const setJiraAuthHeader = (apiToken: string) => {
	(jiraApi.defaults.headers as unknown) = {
		...(jiraApi.defaults.headers as unknown as CustomAxiosHeaders),
		Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${apiToken}`).toString("base64")}`,
	} as CustomAxiosHeaders;
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

const authenticateAndAddComment = async (issueKey: string, comment: string): Promise<void> => {
	try {
		const headers = jiraApi.defaults.headers as unknown as CustomAxiosHeaders;
		// Ensure headers is properly structured for Axios request
		Object.assign(headers, {
			Authorization: `Bearer ${process.env.JIRA_API_TOKEN}`,
			Accept: "application/json",
			"User-Agent": "axios/0.21.4", // Adapt as necessary
		});

		const response: AxiosResponse = await jiraApi.get("/rest/auth/1/session");

		console.log(response.data);
	} catch (error) {
		console.error("Error authenticating and adding comment:", error);
	}
};

export const testConnection = async () => {
	try {
		const response = await jiraApi.get("/api/proxy/rest/api/3/myself");
		console.log("Connection test successful:", response.data);
		return response.data;
	} catch (error) {
		console.error("Connection test failed:", error);
		throw error;
	}
};

export const initializeJiraApi = (email: string, apiToken: string) => {
	const base64Credentials = btoa(`${email}:${apiToken}`);
	jiraApi.defaults.headers["Authorization"] = `Basic ${base64Credentials}`;

	// Log the headers (without showing the full token)
	console.log("JIRA API initialized with headers:", {
		...jiraApi.defaults.headers,
		Authorization: "Basic [hidden]",
	});
};

// Function to get available projects
export const getProjects = async (): Promise<JiraProject[]> => {
	try {
		console.log("Fetching projects - current headers:", jiraApi.defaults.headers);
		const response = await jiraApi.get<ProjectResponse>("/api/proxy/rest/api/3/project/search");
		console.log("Raw projects response:", response.data);
		return response.data.values;
	} catch (error) {
		console.error("Error fetching projects:");
		if (axios.isAxiosError(error)) {
			console.error("Status:", error.response?.status);
			console.error("Response:", error.response?.data);
			console.error("Request URL:", error.config?.url);
			if (error.response?.status === 401) {
				console.error("Authentication failed - please check your credentials");
			} else if (error.response?.status === 403) {
				console.error("Authorization failed - please check your permissions");
			}
		}
		throw error;
	}
};

// Existing credential setup function
// Check if a project exists
export const checkProject = async (projectKey: string): Promise<boolean> => {
	try {
		console.log("Checking project:", projectKey);
		const response = await jiraApi.get(`/api/proxy/rest/api/3/project/${projectKey}`);
		console.log("Project exists:", response.data);
		return true;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			console.log("Project does not exist:", projectKey);
			return false;
		}
		console.error("Error checking project:", error);
		throw error;
	}
};

// List all accessible projects
export const listProjects = async (): Promise<void> => {
	try {
		const response = await jiraApi.get("/api/proxy/rest/api/3/project");
		console.log("Available projects:");
		response.data.forEach((project: any) => {
			console.log(`- ${project.key}: ${project.name}`);
		});
	} catch (error) {
		console.error("Error listing projects:", error);
		if (axios.isAxiosError(error)) {
			console.error("Response:", error.response?.data);
		}
		throw error;
	}
};

// Function to create a new issue
export const createIssue = async (projectKey: string, summary: string, description: string): Promise<IssueResponse> => {
	try {
		const response = await jiraApi.post(`/api/proxy/rest/api/3/issue`, {
			fields: {
				project: {
					key: projectKey,
				},
				summary,
				description,
				issuetype: {
					name: "Story",
				},
			},
		});
		return response.data;
	} catch (error) {
		console.error("Error creating issue:", error);
		throw error;
	}
};

// Test JQL query directly
export const testJqlQuery = async (jql: string): Promise<any> => {
	try {
		const encodedJql = encodeURIComponent(jql);
		console.log("Testing JQL query:", jql);
		console.log("Encoded JQL:", encodedJql);

		const response = await jiraApi.get("/api/proxy/rest/api/3/search", {
			params: {
				jql,
				maxResults: 1, // Just get one result for testing
			},
			paramsSerializer: {
				encode: encodeURIComponent,
			},
		});

		console.log("JQL test successful:", response.data);
		return response.data;
	} catch (error) {
		console.error("JQL test failed:");
		if (axios.isAxiosError(error)) {
			console.error("URL:", error.config?.url);
			console.error("Response:", error.response?.data);
		}
		throw error;
	}
};

// Function to fetch all issues
export const fetchIssues = async (): Promise<any[]> => {
	try {
		const response = await jiraApi.get<IssueResponse>("/api/proxy/rest/api/3/search", {
			params: {
				jql: "project = TADTECHJC ORDER BY created DESC",
				fields: "summary,description,status,created,updated",
			},
		});

		return response.data.issues.map((issue) => ({
			id: issue.id,
			key: issue.key,
			summary: issue.fields.summary,
			description: issue.fields.description,
			status: issue.fields.status.name,
			created: issue.fields.created,
			updated: issue.fields.updated,
		}));
	} catch (error) {
		console.error("Error fetching issues:", error);
		throw error;
	}
};

export const setJiraCredentials = (email: string, apiToken: string) => {
	const base64Credentials = btoa(`${email}:${apiToken}`);
	jiraApi.defaults.headers["Authorization"] = `Basic ${base64Credentials}`;
};

// New function to get available transitions for an issue
export const getAvailableTransitions = async (issueKey: string): Promise<WorkflowTransition[]> => {
	try {
		const response = await jiraApi.get(`/api/proxy/rest/api/3/issue/${issueKey}/transitions`);
		return response.data.transitions;
	} catch (error) {
		console.error("Error fetching transitions:", error);
		throw error;
	}
};

// Function to transition an issue
export const transitionIssue = async (issueKey: string, transitionId: string): Promise<void> => {
	try {
		await jiraApi.post(`/api/proxy/rest/api/3/issue/${issueKey}/transitions`, {
			transition: { id: transitionId },
		});
	} catch (error) {
		console.error("Error transitioning issue:", error);
		throw error;
	}
};

// Function to add a comment to an issue
export const addComment = async (issueKey: string, comment: string): Promise<JiraComment> => {
	try {
		// Log the request details (for debugging)
		console.log("Adding comment to issue:", issueKey);
		console.log("Current headers:", {
			...jiraApi.defaults.headers,
			Authorization: "Basic [hidden]",
		});

		const response = await jiraApi.post(`/api/proxy/rest/api/3/issue/${issueKey}/comment`, {
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
		});

		return response.data;
	} catch (error) {
		console.error("Error adding comment:", error);
		if (axios.isAxiosError(error)) {
			console.error("Response status:", error.response?.status);
			console.error("Response data:", error.response?.data);
			console.error("Request URL:", error.config?.url);
			console.error("Request headers:", {
				...error.config?.headers,
				Authorization: "Basic [hidden]",
			});
		}
		throw error;
	}
};

// Function to get comments for an issue
export const getComments = async (issueKey: string): Promise<JiraComment[]> => {
	try {
		const response = await jiraApi.get(`/api/proxy/rest/api/3/issue/${issueKey}/comment`);
		return response.data.comments;
	} catch (error) {
		console.error("Error fetching comments:", error);
		throw error;
	}
};

// Function to create a public ticket (no authentication required)
export const createPublicTicket = async (summary: string, description: string, email: string): Promise<string> => {
	try {
		const response = await axios.post("/api/public/tickets", {
			summary,
			description,
			email,
		});
		return response.data.key;
	} catch (error) {
		console.error("Error creating public ticket:", error);
		throw error;
	}
};

// Function to get public ticket status
export const getPublicTicketStatus = async (ticketKey: string, email: string): Promise<PublicTicket> => {
	try {
		const response = await axios.get(`/api/public/tickets/${ticketKey}`, {
			params: { email },
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching public ticket:", error);
		throw error;
	}
};

// Function to watch an issue
export const watchIssue = async (issueKey: string): Promise<void> => {
	try {
		await jiraApi.post(`/api/proxy/rest/api/3/issue/${issueKey}/watchers`);
	} catch (error) {
		console.error("Error watching issue:", error);
		throw error;
	}
};

export async function updateIssue(issueKey: string, updates: object) {
	const response = await jiraApi.put(`/rest/api/3/issue/${issueKey}`, updates);
	return response.data;
}

// Function to get issue details including status and comments
export const getIssueDetails = async (issueKey: string): Promise<any> => {
	try {
		const response = await jiraApi.get(`/api/proxy/rest/api/3/issue/${issueKey}`, {
			params: {
				fields: "summary,assignee,description,status,comment,created,updated",
			},
		});
		console.log("CHIP DEBUG: ", response);
		return response.data;
	} catch (error) {
		console.error("Error fetching issue details:", error);
		throw error;
	}
};
export type { PublicTicket };

export type { WorkflowTransition, JiraComment };
export type { JiraProject };
