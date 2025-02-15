// app/api/issues/[issueKey]/comments/route.ts
import { RouteSegmentProps } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: RouteSegmentProps) {
	try {
		const body = await request.json();
		const { issueKey } = params;

		const modifiedBody = {
			...body,
			body: {
				type: "doc",
				version: 1,
				content: [
					{
						type: "paragraph",
						content: [
							{
								type: "text",
								text: body.body.content[0].content[0].text,
							},
							{
								type: "hardBreak",
							},
							{
								type: "hardBreak",
							},
							{
								type: "text",
								text: "Comment made on behalf of requestor",
								marks: [
									{
										type: "em",
									},
								],
							},
						],
					},
				],
			},
		};

		const response = await fetch(`${process.env.NEXT_PUBLIC_JIRA_URL}/rest/api/3/issue/${issueKey}/comment`, {
			method: "POST",
			headers: {
				Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString("base64")}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(modifiedBody),
		});

		const data = await response.json();

		if (!response.ok) {
			return NextResponse.json({ error: data.errorMessages || "Failed to add comment" }, { status: response.status });
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Error adding comment:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
