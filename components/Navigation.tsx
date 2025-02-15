// components/Navigation.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, LogOut } from "lucide-react";

export function Navigation() {
	const { data: session } = useSession();

	if (!session) return null;

	// Get initials from email
	const initials =
		session.user?.email
			?.split("@")[0]
			.split(".")
			.map((n) => n[0])
			.join("")
			.toUpperCase() || "??";

	const handleSignOut = () => {
		signOut({ callbackUrl: "/" });
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<nav className="container h-14 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Link href="/issues" className="font-semibold">
						JIRA Client
					</Link>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" className="flex items-center gap-2" asChild>
						<Link href="/issues/new">
							<PlusCircle className="h-4 w-4" />
							<span>New Issue</span>
						</Link>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
								<Avatar className="h-8 w-8">
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">Account</p>
									<p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</nav>
		</header>
	);
}
