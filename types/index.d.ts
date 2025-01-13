export interface JiraDashboardData {
	totalIssues: number;
	openIssues: number;
	recentActivity: string[];
}

export interface Issue {
	id: string;
	summary: string;
	description: string;
}
