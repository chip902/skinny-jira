import { NextResponse } from "next/server";
import SendGrid from "@sendgrid/mail";

SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);
const SENDER_EMAIL = process.env.MAIL_USER;

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { to } = body;

		if (!to || !isValidEmail(to)) {
			return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
		}
		const otp = generateOTP();
		await SendGrid.send({
			from: `"Jira Login" <${SENDER_EMAIL}>`,
			to,
			subject: "Your Jira Login OTP",
			text: `Your one-time password is ${otp}`,
		});

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error("Failed to send email:", error);
		return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
	}
}

function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}
