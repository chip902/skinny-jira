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
		assignee: JiraAssignee;
		comment: JiraComment[];
		summary: string;
		description?: JiraDescriptionPayload;
		status: {
			self: string;
			description: string;
			iconUrl: string;
			name: string;
			id: string;
			statusCategory: {
				self: string;
				id: number;
				key: string;
				colorName: string;
				name: string;
			};
		};
		created: string;
		updated: string;
	};
}

export interface JiraTextElement {
	type: "text";
	text: string;
}

export interface JiraContentBlock {
	type: string;
	content: JiraTextElement[];
}

export interface JiraDescriptionPayload {
	type: "doc";
	version: number;
	content: JiraContentBlock[];
}

export interface JiraAssignee {
	self: string;
	accountId: string;
	emailAddress: string;
	avatarUrls: {
		[key: string]: string;
	};
	displayName: string;
	active: boolean;
	timeZone: string;
	accountType: string;
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
