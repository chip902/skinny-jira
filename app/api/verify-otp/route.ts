import { NextResponse } from "next/server";
import crypto from "crypto";

const secretKey = process.env.JIRA_API_TOKEN;

export async function GET(request: Request) {
	try {
		const cookies =
			request.headers
				.get("Cookie")
				?.split(",")
				.map((c) => c.trim()) || [];
		const token = request.headers.get("Authorization")?.split(" ")[1];
		if (!token) {
			return NextResponse.json({ error: "No token provided" }, { status: 401 });
		}

		// Get your public key from environment or file system
		const publicKey = process.env.PUBLIC_KEY!;

		// Create payload to verify
		const payload = {
			email: "",
			expires: 0,
		};

		// Verify token
		const verifier = crypto.createVerify("SHA256").update(JSON.stringify(payload));

		const isValid = verifier.verify(publicKey, Buffer.from(token, "base64"));

		if (!isValid) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		return NextResponse.json({ valid: true });
	} catch (error) {
		return NextResponse.json({ message: error }, { status: 401 });
	}
}
