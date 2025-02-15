import SendGrid from "@sendgrid/mail";

SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);

interface OTPEntity {
	code: string;
	createdAt: number;
	email: string; // Add email to track which OTP belongs to which user
}

export const otpStore: OTPEntity[] = [];
const OTP_EXPIRATION_TIME = 5 * 60 * 1000;

export async function sendOTP(to: string) {
	try {
		const otp = generateOTP();

		// Store the OTP before sending
		otpStore.push({
			code: otp,
			createdAt: Date.now(),
			email: to,
		});

		// Use environment variables for sender email
		const senderEmail = process.env.SENDGRID_FROM_EMAIL;
		if (!senderEmail) {
			throw new Error("SENDGRID_FROM_EMAIL is not configured");
		}

		await SendGrid.send({
			from: `"Jira Login" <${senderEmail}>`,
			to,
			subject: "Your Jira Login OTP",
			text: `Your one-time password is ${otp}`,
			html: `<h1>Your Login OTP</h1>
                   <p>Use this code to complete your login:</p>
                   <h2>${otp}</h2>
                   <p>This code will expire in 5 minutes.</p>`,
		});

		console.log("OTP sent successfully to:", to); // Add logging
		return otp;
	} catch (error) {
		console.error("Failed to send email:", error);
		throw error;
	}
}

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function verifyOTP(otp: string): Promise<boolean> {
	// Find the OTP in our store that matches and hasn't expired
	const validOtp = otpStore.find((entity) => {
		return entity.code === otp && Date.now() - entity.createdAt < OTP_EXPIRATION_TIME;
	});

	if (validOtp) {
		// Remove the OTP from store after verification to prevent reuse
		const index = otpStore.indexOf(validOtp);
		if (index > -1) {
			otpStore.splice(index, 1);
		}
		console.log("OTP verified successfully"); // Add logging
		return true;
	}

	console.log("OTP verification failed"); // Add logging
	return false;
}
