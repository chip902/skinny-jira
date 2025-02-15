// app/api/auth/set-password/route.ts
import { NextResponse } from "next/server";
import { setPassword } from "@/services/authService";

export async function POST(req: Request) {
	try {
		const { email, password } = await req.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
		}

		await setPassword(email, password);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error setting password:", error);
		return NextResponse.json({ error: "Failed to set password" }, { status: 500 });
	}
}
