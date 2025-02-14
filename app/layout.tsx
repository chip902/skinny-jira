// app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import ThemeProvider from "../components/theme-provider";
import ClientLayout from "./ClientLayout";

const roboto = Roboto({
	subsets: ["latin"],
	weight: "500",
});

export const metadata: Metadata = {
	title: "JIRA Client App",
	description: "A thin client web app for JIRA Cloud",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html suppressHydrationWarning={true}>
			<body className={roboto.className}>
				<ThemeProvider>
					<ClientLayout>{children}</ClientLayout>
				</ThemeProvider>
			</body>
		</html>
	);
}
