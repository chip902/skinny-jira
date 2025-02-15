import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { otpStore, sendOTP, verifyOTP } from "@/services/authService";

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			id: "credentials",
			name: "Email & OTP",
			credentials: {
				email: {
					label: "Email",
					type: "email",
				},
				otp: {
					label: "OTP",
					type: "text",
				},
				step: {
					type: "hidden",
				},
			},
			async authorize(credentials) {
				try {
					if (!credentials?.email) {
						throw new Error("Email is required");
					}

					if (credentials?.step === "request-otp") {
						// First step: Send OTP
						const otp = await sendOTP(credentials.email);

						// Store OTP in your otpStore
						otpStore.push({
							code: otp,
							createdAt: Date.now(),
							email: credentials.email,
						});

						throw new Error("OTP_SENT");
					}

					// Second step: Verify OTP
					if (!credentials?.otp) {
						throw new Error("OTP is required");
					}

					const isValid = await verifyOTP(credentials.otp);
					if (!isValid) {
						throw new Error("Invalid OTP");
					}

					// Check approved domains
					const approvedDomains = ["wu.com", "performics.com", "westernunion.com, chepurny.com"];
					const emailDomain = credentials.email.split("@")[1];
					if (!approvedDomains.includes(emailDomain)) {
						throw new Error("Unauthorized domain");
					}

					// Return the user object
					return {
						id: credentials.email,
						email: credentials.email,
						role: "user",
					};
				} catch (error) {
					console.error("Authentication failed:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.role = token.role as string;
			}
			return session;
		},
	},
	pages: {
		signIn: "/",
		error: "/error",
	},
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
};

export default NextAuth(authOptions);
