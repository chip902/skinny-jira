import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
	const JIRA_URL = new URL(process.env.NEXT_PUBLIC_JIRA_URL || "");
	const JIRA_EMAIL = process.env.NEXT_PUBLIC_JIRA_EMAIL;
	const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
	console.log("CHIP DEBUG: IN PROXY ROUTE");

	if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
		console.error("Missing JIRA configuration:", { JIRA_URL, JIRA_EMAIL: !!JIRA_EMAIL, JIRA_API_TOKEN: !!JIRA_API_TOKEN });
		return new NextResponse(JSON.stringify({ error: "Server configuration error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const url = new URL(req.url);
		const targetUrl = `${JIRA_URL.origin}${url.pathname.replace("/api/proxy", "")}${url.search}`;

		console.log("=== JIRA Proxy Debug ===");
		console.log("Target URL:", targetUrl);
		console.log("Method:", req.method);
		console.log("Original headers:", Object.fromEntries(req.headers));

		const authString = `${JIRA_EMAIL}:${JIRA_API_TOKEN}`;
		const base64Auth = Buffer.from(authString).toString("base64");

		const headers = new Headers({
			Authorization: `Basic ${base64Auth}`,
			"Content-Type": "application/json",
			Accept: "application/json",
			host: JIRA_URL.host,
		});

		// Log headers we're sending to JIRA (excluding auth)
		const headersForLog = Object.fromEntries(headers.entries());
		delete headersForLog.authorization;
		console.log("Outgoing headers:", headersForLog);

		const response = await fetch(targetUrl, {
			method: req.method,
			headers: headers,
			body: req.method !== "GET" ? req.body : undefined,
		});

		console.log("JIRA Response:", {
			status: response.status,
			statusText: response.statusText,
		});

		if (!response.ok) {
			const text = await response.text();
			console.error("Error response from JIRA:", {
				status: response.status,
				statusText: response.statusText,
				body: text,
			});
			return new NextResponse(text, {
				status: response.status,
				statusText: response.statusText,
				headers: {
					"Content-Type": response.headers.get("Content-Type") || "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		const proxyResponse = new NextResponse(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: {
				"Content-Type": response.headers.get("Content-Type") || "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});

		return proxyResponse;
	} catch (error) {
		console.error("Error in proxy handler:", error);
		return new NextResponse(
			JSON.stringify({
				error: "Internal Server Error",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
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
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		},
	});
};
