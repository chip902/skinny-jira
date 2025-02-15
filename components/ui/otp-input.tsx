// components/ui/otp-input.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
	value: string;
	onValueChange: (value: string) => void;
	maxLength?: number;
}

const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(({ className, value, onValueChange, maxLength = 6, ...props }, ref) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value.replace(/[^0-9]/g, "");
		if (input.length <= maxLength) {
			onValueChange(input);
		}
	};

	return (
		<input
			ref={ref}
			type="text"
			inputMode="numeric"
			pattern="\d*"
			maxLength={maxLength}
			value={value}
			onChange={handleChange}
			className={cn(
				"flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center tracking-widest",
				className
			)}
			{...props}
		/>
	);
});
OTPInput.displayName = "OTPInput";

export { OTPInput };
