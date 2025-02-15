// auth.config.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { sendOTP, verifyOTP, checkIsRegistered, verifyPassword, setPassword } from "@/services/authService";

const APPROVED_DOMAINS = ["wu.com", "performics.com", "westernunion.com", "chepurny.com", "publicis.com", "publicismedia.com", "performics.com"];

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			id: "credentials",
			name: "Email & Password",
			credentials: {
				email: {
					label: "Email",
					type: "email",
				},
				password: {
					label: "Password",
					type: "password",
				},
				otp: {
					label: "OTP",
					type: "text",
				},
				step: {
					type: "hidden",
				},
				authType: {
					type: "hidden",
				},
			},
			async authorize(credentials) {
				try {
					if (!credentials?.email) {
						throw new Error("Email is required");
					}

					// Check domain before proceeding
					const emailDomain = credentials.email.split("@")[1];
					if (!APPROVED_DOMAINS.includes(emailDomain)) {
						throw new Error("Your email domain is not authorized.");
					}

					const isRegistered = await checkIsRegistered(credentials.email);

					// Handle OTP request
					if (credentials?.step === "request-otp") {
						await sendOTP(credentials.email);
						throw new Error("OTP_SENT");
					}

					// Handle login with password
					if (credentials?.authType === "login" && credentials?.password) {
						if (!isRegistered) {
							throw new Error("ACCOUNT_NOT_REGISTERED");
						}

						const isValid = await verifyPassword(credentials.email, credentials.password);
						if (!isValid) {
							throw new Error("Invalid password");
						}

						return {
							id: credentials.email,
							email: credentials.email,
							role: "user",
						};
					}

					// Handle OTP verification
					if (credentials?.otp) {
						const isValid = await verifyOTP(credentials.otp, credentials.email);
						if (!isValid) {
							throw new Error("Invalid OTP");
						}

						// If this is a registration or reset, we'll handle password setting in the frontend
						if (credentials.authType === "register" || credentials.authType === "reset") {
							throw new Error("OTP_VERIFIED");
						}

						return {
							id: credentials.email,
							email: credentials.email,
							role: "user",
						};
					}

					throw new Error("Invalid credentials");
				} catch (error) {
					console.error("Authentication error:", error);
					throw error;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role;
				token.email = user.email;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.role = token.role as string;
				session.user.email = token.email as string;
			}
			return session;
		},
	},
	pages: {
		signIn: "/",
		error: "/error",
	},
	debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
