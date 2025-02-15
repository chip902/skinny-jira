// /auth.ts

import NextAuth from "next-auth";
import { authOptions } from "./auth.config";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

export const handler = NextAuth(authOptions);

export async function auth(...args: [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]] | [NextApiRequest, NextApiResponse] | []) {
	return getServerSession(...args, authOptions);
}

export { handler as GET, handler as POST, authOptions };
