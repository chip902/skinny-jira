import axios from 'axios';

const jiraApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_JIRA_URL,
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_JIRA_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const fetchJiraData = async (jiraUrl: string, jiraToken: string) => {
  // Update the API configuration with the provided URL and token
  jiraApi.defaults.baseURL = jiraUrl;
  jiraApi.defaults.headers['Authorization'] = `Bearer ${jiraToken}`;

  // Fetch dashboard data
  const [totalIssues, openIssues, recentActivity] = await Promise.all([
    jiraApi.get('/rest/api/3/search?jql=project=YOUR_PROJECT_KEY').then(res => res.data.total),
    jiraApi.get('/rest/api/3/search?jql=project=YOUR_PROJECT_KEY AND status=Open').then(res => res.data.total),
    jiraApi.get('/rest/api/3/activity').then(res => res.data.slice(0, 5).map((item: any) => item.title)),
  ]);

  return { totalIssues, openIssues, recentActivity };
};

export const fetchIssues = async () => {
  const response = await jiraApi.get('/rest/api/3/search?jql=project=YOUR_PROJECT_KEY');
  return response.data.issues;
};

export const createIssue = async (issueData: { summary: string; description: string }) => {
  const response = await jiraApi.post('/rest/api/3/issue', {
    fields: {
      project: { key: 'YOUR_PROJECT_KEY' },
      summary: issueData.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: issueData.description }] }],
      },
      issuetype: { name: 'Task' },
    },
  });
  return response.data;
};

export const updateIssue = async (issueId: string, issueData: { summary: string; description: string }) => {
  const response = await jiraApi.put(`/rest/api/3/issue/${issueId}`, {
    fields: {
      summary: issueData.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: issueData.description }] }],
      },
    },
  });
  return response.data;
};