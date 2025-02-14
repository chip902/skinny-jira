import { NextResponse } from "next/server";
import crypto from "crypto";

const secretKey = process.env.SECRET_KEY!;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email } = body;

		// Validate email
		if (!validateEmail(email)) {
			return NextResponse.json({ message: "Invalid email" }, { status: 400 });
		}

		// Check domain eligibility
		const domain = email.split("@")[1];
		if (!isEligibleDomain(domain)) {
			return NextResponse.json({ message: "Not eligible" }, { status: 403 });
		}

		// Generate token
		const privateKey = crypto.createHash("sha256").update(secretKey).digest("hex");
		const payload = {
			email,
			expires: Date.now() + 300000, // Token expires in 5 minutes
		};

		const signature = crypto.sign(
			"sha256", // signing algorithm
			Buffer.from(JSON.stringify(payload)), // data to sign
			privateKey // private key
		);

		// Set cookie
		const response = NextResponse.json({ message: "Access granted" });
		response.headers.set("Set-Cookie", `token=${signature}; Path=/; SameSite=Lax; Secure=${process.env.NODE_ENV === "production"}; HttpOnly=true`);

		return response;
	} catch (error) {
		return NextResponse.json({ message: error }, { status: 400 });
	}
}

function validateEmail(email: string): boolean {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

function isEligibleDomain(domain: string): boolean {
	// Add eligible domains here
	return ["example.com", "alloweddomain.org"].includes(domain.toLowerCase());
}
