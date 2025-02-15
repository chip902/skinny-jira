// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	function middleware(req) {
		console.log("Middleware running for path:", req.nextUrl.pathname);
		console.log("User token:", req.nextauth.token);

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({ token }) => {
				console.log("Checking authorization, token:", token);
				return !!token;
			},
		},
	}
);

export const config = {
	matcher: ["/issues/:path*", "/dashboard/:path*"],
};
