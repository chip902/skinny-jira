// components/ui/toast-messages.tsx
import { ReactNode } from "react";

interface ToastMessageProps {
	title: string;
	description?: string;
}

export function ToastMessage({ title, description }: ToastMessageProps): ReactNode {
	return (
		<div className="grid gap-1">
			<div className="font-semibold">{title}</div>
			{description && <div className="text-sm opacity-90">{description}</div>}
		</div>
	);
}
