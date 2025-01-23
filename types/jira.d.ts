export interface JiraComment {
	id: string;
	body: {
		content: Array<{
			content: Array<{
				text: string;
			}>;
		}>;
	};
	author: {
		displayName: string;
		emailAddress?: string;
	};
	created: string;
}
export interface JiraTicket {
	key: string;
	summary: string;
	status: string;
	created: string;
	updated: string;
	comments?: JiraComment[];
}

export interface CreateTicketPayload {
	summary: string;
	description: string;
	email: string;
}

export interface CreateTicketResponse {
	key: string;
}

export interface JiraProject {
	id: string;
	key: string;
	name: string;
}

export interface ProjectResponse {
	values: JiraProject[];
}

export interface JiraIssue {
	id: string;
	key: string;
	fields: {
		summary: string;
		description: any;
		status: {
			name: string;
		};
		created: string;
		updated: string;
	};
}

export interface IssueResponse {
	issues: JiraIssue[];
	total: number;
}

export interface WorkflowTransition {
	id: string;
	name: string;
	to: {
		name: string;
	};
}

export interface PublicTicket {
	key: string;
	summary: string;
	description: string;
	status: string;
	created: string;
	updated: string;
	comments: JiraComment[];
}
