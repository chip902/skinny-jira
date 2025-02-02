import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { issueKey: string } }) {
	const [{ issueKey }, { transitionId }] = await Promise.all([Promise.resolve(params), req.json()]);

	try {
		const response = await fetch(`${process.env.NEXT_PUBLIC_JIRA_URL}/rest/api/3/issue/${issueKey}/transitions`, {
			method: "POST",
			headers: {
				Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64")}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				transition: {
					id: transitionId,
				},
			}),
		});

		// Check if response is ok before trying to parse JSON
		if (!response.ok) {
			let errorMessage = "Failed to change status";
			try {
				const errorData = await response.json();
				errorMessage = errorData.errorMessages?.[0] || errorMessage;
			} catch (e) {
				// If JSON parsing fails, use the status text
				errorMessage = response.statusText || errorMessage;
			}
			return NextResponse.json({ error: errorMessage }, { status: response.status });
		}

		// Handle empty response case
		const text = await response.text();
		if (!text) {
			// If response is empty but status was ok, consider it successful
			return NextResponse.json({ success: true });
		}

		// Try to parse JSON only if we have content
		try {
			const data = JSON.parse(text);
			return NextResponse.json(data);
		} catch (e) {
			// If parsing fails but status was ok, consider it successful
			return NextResponse.json({ success: true });
		}
	} catch (error) {
		console.error("Error changing workflow:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
