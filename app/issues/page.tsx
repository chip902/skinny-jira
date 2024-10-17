"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchIssues, createIssue, updateIssue } from '@/lib/jira-api';

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [newIssue, setNewIssue] = useState({ summary: '', description: '' });
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const fetchedIssues = await fetchIssues();
      setIssues(fetchedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const handleCreateIssue = async () => {
    try {
      await createIssue(newIssue);
      setNewIssue({ summary: '', description: '' });
      loadIssues();
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;
    try {
      await updateIssue(selectedIssue.id, selectedIssue);
      setSelectedIssue(null);
      loadIssues();
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">JIRA Issues</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-issue-summary">Summary</Label>
                <Input
                  id="new-issue-summary"
                  value={newIssue.summary}
                  onChange={(e) => setNewIssue({ ...newIssue, summary: e.target.value })}
                  placeholder="Enter issue summary"
                />
              </div>
              <div>
                <Label htmlFor="new-issue-description">Description</Label>
                <Textarea
                  id="new-issue-description"
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Enter issue description"
                />
              </div>
              <Button onClick={handleCreateIssue}>Create Issue</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issue List</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li key={issue.id} className="flex justify-between items-center">
                  <span>{issue.summary}</span>
                  <Button onClick={() => setSelectedIssue(issue)}>Edit</Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {selectedIssue && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Edit Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-issue-summary">Summary</Label>
                <Input
                  id="edit-issue-summary"
                  value={selectedIssue.summary}
                  onChange={(e) => setSelectedIssue({ ...selectedIssue, summary: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-issue-description">Description</Label>
                <Textarea
                  id="edit-issue-description"
                  value={selectedIssue.description}
                  onChange={(e) => setSelectedIssue({ ...selectedIssue, description: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateIssue}>Update Issue</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}