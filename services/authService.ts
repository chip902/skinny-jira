// services/authService.ts
import SendGrid from "@sendgrid/mail";
import { createClient } from "@supabase/supabase-js";
import { add } from "date-fns";
import bcrypt from "bcryptjs";

if (!process.env.SENDGRID_API_KEY) {
	console.error("SENDGRID_API_KEY is not set in environment variables");
}
if (!process.env.SENDGRID_FROM_EMAIL) {
	console.error("SENDGRID_FROM_EMAIL is not set in environment variables");
}

SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
	db: {
		schema: "next_auth",
	},
});

const OTP_EXPIRATION_MINUTES = 5;

export async function checkIsRegistered(email: string): Promise<boolean> {
	const { data, error } = await supabase.from("users").select("is_registered").eq("email", email).single();

	if (error || !data) return false;
	return data.is_registered;
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
	const { data: user, error } = await supabase.from("users").select("password_hash").eq("email", email).single();

	if (error || !user?.password_hash) return false;
	return bcrypt.compare(password, user.password_hash);
}

export async function setPassword(email: string, password: string): Promise<void> {
	const passwordHash = await bcrypt.hash(password, 10);

	const { error } = await supabase
		.from("users")
		.update({
			password_hash: passwordHash,
			is_registered: true,
		})
		.eq("email", email);

	if (error) {
		throw new Error("Failed to set password");
	}
}

export async function sendOTP(to: string): Promise<string> {
	try {
		console.log("Step 1: Starting OTP send process for:", to);

		await cleanupExpiredOTPs();
		const otp = generateOTP();

		const senderEmail = process.env.SENDGRID_FROM_EMAIL;
		if (!senderEmail) {
			throw new Error("SENDGRID_FROM_EMAIL is not configured");
		}

		// Check if user is already registered
		const isRegistered = await checkIsRegistered(to);
		const emailSubject = isRegistered ? "Your Password Reset Code" : "Your Registration Code";

		const msg = {
			to,
			from: {
				email: senderEmail,
				name: "JIRA Notification Service",
			},
			subject: emailSubject,
			html: `
		  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="text-align: left; margin-bottom: 30px;">
			  <h1 style="color: #0052CC; margin: 0; font-size: 24px;">Verification Code</h1>
			</div>
			<p style="color: #344563; font-size: 16px; margin-bottom: 24px;">
			  ${isRegistered ? "Use this code to reset your password:" : "Use this code to complete your registration:"}
			</p>
			<div style="background-color: #F4F5F7; padding: 24px; border-radius: 4px; text-align: center; margin-bottom: 24px;">
			  <h2 style="font-family: monospace; font-size: 32px; letter-spacing: 8px; margin: 0; color: #172B4D;">${otp}</h2>
			</div>
			<p style="color: #344563; font-size: 14px; margin-bottom: 24px;">
			  This code will expire in ${OTP_EXPIRATION_MINUTES} minutes for security purposes.
			</p>
		  </div>
		`,
		};

		await SendGrid.send(msg);
		console.log("Email sent successfully");

		// Ensure user exists in database
		const { error: userError } = await supabase.from("users").upsert(
			{
				email: to,
				emailVerified: new Date().toISOString(),
			},
			{
				onConflict: "email",
				ignoreDuplicates: true,
			}
		);

		if (userError) {
			throw new Error(`Failed to create/update user: ${userError.message}`);
		}

		// Store OTP
		const { error: insertError } = await supabase.from("otp_codes").insert({
			email: to,
			code: otp,
			expires_at: add(new Date(), { minutes: OTP_EXPIRATION_MINUTES }),
		});

		if (insertError) {
			throw new Error(`Failed to store OTP: ${insertError.message}`);
		}

		return otp;
	} catch (error) {
		console.error("Failed to send OTP:", error);
		throw error;
	}
}

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function verifyOTP(otp: string, email: string): Promise<boolean> {
	console.log("Starting OTP verification for email:", email);

	// Clean up expired OTPs first
	await cleanupExpiredOTPs();

	// Find valid OTP in database
	const { data: validOtps, error: selectError } = await supabase
		.from("otp_codes")
		.select("*")
		.eq("email", email)
		.eq("code", otp)
		.gte("expires_at", new Date().toISOString())
		.single();

	if (selectError) {
		console.error("Error verifying OTP:", selectError);
		return false;
	}

	if (!validOtps) {
		console.log("No valid OTP found");
		return false;
	}

	// Delete the used OTP
	const { error: deleteError } = await supabase.from("otp_codes").delete().eq("id", validOtps.id);

	if (deleteError) {
		console.error("Error deleting used OTP:", deleteError);
	}

	console.log("OTP verified successfully");
	return true;
}

async function cleanupExpiredOTPs(): Promise<void> {
	const { error } = await supabase.from("otp_codes").delete().lt("expires_at", new Date().toISOString());

	if (error) {
		console.error("Error cleaning up expired OTPs:", error);
	}
}
