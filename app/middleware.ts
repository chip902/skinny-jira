import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const secretKey = process.env.SECRET_KEY!;

export async function middleware(request: NextRequest) {
	try {
		const token = request.cookies.get("token")?.value;
		const hasToken = request.cookies.has("token");

		// Skip if already authenticated
		if (request.headers.get("Authorization") || token) {
			const response = NextResponse.next();

			// Optionally set or modify cookies
			response.cookies.set("lastAccess", new Date().toISOString());

			return response;
		}

		// Check token
		const response = await fetch(new URL("/api/validate-token", request.url));

		if (response.ok) {
			return NextResponse.next();
		} else {
			const landingPage = new URL("/landing", request.url);
			return NextResponse.redirect(landingPage);
		}
	} catch (error) {
		const landingPage = new URL("/landing", request.url);
		return NextResponse.redirect(landingPage);
	}
}
