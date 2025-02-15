// hooks/useRole.ts
import { useSession } from "next-auth/react";

export function useRole() {
	const { data: session } = useSession();

	return session?.user?.role || "limited";
}
