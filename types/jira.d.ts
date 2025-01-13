export interface JiraComment {
	id: number;
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
