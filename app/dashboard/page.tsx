"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchJiraData } from '@/lib/jira-api';

export default function Dashboard() {
  const [jiraToken, setJiraToken] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  const handleConnect = async () => {
    try {
      const data = await fetchJiraData(jiraUrl, jiraToken);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching JIRA data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">JIRA Dashboard</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connect to JIRA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="jira-url">JIRA Cloud URL</Label>
              <Input
                id="jira-url"
                value={jiraUrl}
                onChange={(e) => setJiraUrl(e.target.value)}
                placeholder="https://your-domain.atlassian.net"
              />
            </div>
            <div>
              <Label htmlFor="jira-token">Personal Access Token</Label>
              <Input
                id="jira-token"
                type="password"
                value={jiraToken}
                onChange={(e) => setJiraToken(e.target.value)}
                placeholder="Enter your JIRA Personal Access Token"
              />
            </div>
            <Button onClick={handleConnect}>Connect</Button>
          </div>
        </CardContent>
      </Card>
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{dashboardData.totalIssues}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{dashboardData.openIssues}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                {dashboardData.recentActivity.map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}