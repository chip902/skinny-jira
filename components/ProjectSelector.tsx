"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects, setJiraCredentials, JiraProject } from "@/lib/jira-api";

export default function ProjectSelector() {
	const [projects, setProjects] = useState<JiraProject[]>([]);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = async () => {
		try {
			const projectList = await getProjects();
			setProjects(projectList);
		} catch (error) {
			setError("Failed to load projects. Please make sure your credentials are set correctly.");
			console.error("Error loading projects:", error);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Available JIRA Projects</CardTitle>
			</CardHeader>
			<CardContent>
				{error ? (
					<div className="text-destructive">{error}</div>
				) : (
					<div className="space-y-4">
						<p>Found {projects.length} projects:</p>
						<ul className="space-y-2">
							{projects.map((project) => (
								<li key={project.id} className="p-2 border rounded">
									<div className="font-medium">Project Key: {project.key}</div>
									<div className="text-sm text-muted-foreground">Name: {project.name}</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
