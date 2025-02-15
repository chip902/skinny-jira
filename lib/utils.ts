// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast as hookToast } from "@/hooks/use-toast";
import { ToastMessage } from "@/components/ui/toast-messages";

export async function handleApiResponse(response: Response) {
	const data = await response.json();

	if (!response.ok) {
		hookToast({
			variant: "destructive",
			children: ToastMessage({
				title: data.error?.message || "Error",
				description: data.error?.details || "Something went wrong. Please try again.",
			}),
		});
		throw new Error(data.error?.details || "API Error");
	}

	if (data.success && data.message) {
		hookToast({
			variant: "default",
			children: ToastMessage({
				title: "Success",
				description: data.message,
			}),
		});
	}

	return data;
}
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
