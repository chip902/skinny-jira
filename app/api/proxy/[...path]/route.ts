import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
	console.log("=== Starting Proxy Handler ===");
	const JIRA_URL = process.env.NEXT_PUBLIC_JIRA_URL?.trim();
	const JIRA_EMAIL = process.env.NEXT_PUBLIC_JIRA_EMAIL?.trim();
	const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN?.trim();

	if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
		console.error("Missing JIRA configuration:", {
			hasUrl: !!JIRA_URL,
			hasEmail: !!JIRA_EMAIL,
			hasToken: !!JIRA_API_TOKEN,
		});
		return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
	}

	try {
		const url = new URL(req.url);
		const pathname = url.pathname.replace("/api/proxy", "");
		const targetUrl = new URL(pathname + url.search, JIRA_URL).toString();

		console.log("=== Request Details ===");
		console.log("Method:", req.method);
		console.log("Target URL:", targetUrl);

		// Create auth header
		const base64Auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

		// Get request body for non-GET requests
		let body;
		if (req.method !== "GET" && req.method !== "HEAD") {
			const contentType = req.headers.get("content-type");
			if (contentType?.includes("application/json")) {
				body = await req.json();
				console.log("Request body:", JSON.stringify(body, null, 2));
			} else {
				body = await req.text();
			}
		}

		// Make the request to JIRA
		console.log("=== Making JIRA Request ===");
		const response = await fetch(targetUrl, {
			method: req.method,
			headers: {
				Authorization: `Basic ${base64Auth}`,
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Atlassian-Token": "no-check",
				"User-Agent": "JIRA-Client-App",
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		console.log("JIRA Response Status:", response.status);
		console.log("JIRA Response Headers:", Object.fromEntries(response.headers.entries()));

		if (!response.ok) {
			const errorData = await response.text();
			console.error("=== JIRA Error Response ===");
			console.error("Status:", response.status);
			console.error("Status Text:", response.statusText);
			console.error("Error Data:", errorData);

			try {
				// Try to parse error as JSON
				const jsonError = JSON.parse(errorData);
				return NextResponse.json(jsonError, { status: response.status });
			} catch {
				// If not JSON, return as is
				return new NextResponse(errorData, {
					status: response.status,
					headers: { "Content-Type": "text/plain" },
				});
			}
		}

		const responseData = await response.json();
		console.log("=== Successful Response ===");
		console.log("Response Data:", JSON.stringify(responseData, null, 2));

		return NextResponse.json(responseData);
	} catch (error) {
		console.error("=== Proxy Error ===");
		console.error(error instanceof Error ? error.stack : error);

		return NextResponse.json(
			{
				error: "Proxy Error",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;

export const OPTIONS = async (req: NextRequest) => {
	return new NextResponse(null, {
		status: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": ["Content-Type", "Authorization", "X-Atlassian-Token"].join(", "),
			"Access-Control-Max-Age": "86400",
		},
	});
};
