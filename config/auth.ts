// config/auth.ts
import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
	providers: [
		// Add Jira OAuth provider configuration here
	],
	callbacks: {
		async authorize({ token, user }) {
			// Implement custom authorization logic based on email domain
			if (user?.email) {
				const approvedDomains = ["youragency.com", "anotheragency.com"];
				const domain = user.email.split("@")[1];

				if (!approvedDomains.includes(domain)) {
					throw new Error("Unauthorized domain");
				}

				token.role = "admin"; // Assign admin role based on domain
			}
		},
	},
	secret: process.env.SECRET_KEY,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
