// utils/auth.ts
import axios from "axios";
export function setRoleInStorage(role: string, token?: string) {
	if (token) {
		localStorage.setItem("userRole", role);
		localStorage.setItem("token", token);
		// Optionally set an expiration date
		const expiration = new Date();
		expiration.setDate(expiration.getDate() + 7); // Token expires in 7 days
		document.cookie = `role=${role}; Path=/; Expires=${expiration.toUTCString()}`;
	}
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
	try {
		const response = await axios.post("/api/verify-otp", { email, otp });
		return response.data.valid;
	} catch (error) {
		console.error("Error verifying OTP:", error);
		throw new Error("Failed to verify OTP");
	}
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}
