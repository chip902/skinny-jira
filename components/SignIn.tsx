import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Role } from "@/types";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const SignIn = () => {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [sent, setSent] = useState(false);
	const [role, setRole] = useState<Role | null>(null);
	const router = useRouter();

	const isValidEmail = (email: string) => {
		const approvedDomains = ["performics.com", "wu.com", "westernunion.com", "chepurny.com"];
		const domain = email.split("@")[1]; // Fixed: should check domain part after @
		return approvedDomains.includes(domain);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				step: "request-otp",
				redirect: false,
			});

			if (result?.error) {
				// Special case for OTP_SENT
				if (result.error === "OTP_SENT") {
					setSent(true);
					toast({
						title: "Success",
						description: "OTP sent to your email. Please check your inbox.",
						variant: "default",
					});
					return; // Don't throw error for OTP_SENT
				}
				// Handle other errors
				throw new Error(result.error);
			}
		} catch (error) {
			console.error("Error sending OTP:", error);
			setError(error instanceof Error ? error.message : "Failed to send OTP");
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to send OTP",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleOTPSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				otp,
				step: "verify-otp",
				redirect: false,
			});

			if (result?.error) {
				throw new Error(result.error);
			}

			if (result?.ok) {
				router.push("/issues");
			}
		} catch (error) {
			console.error("Error verifying OTP:", error);
			setError(error instanceof Error ? error.message : "Invalid OTP");
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Invalid OTP",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="signin-container min-h-screen flex items-center justify-center p-4 bg-gray-900">
			<div className="w-full max-w-md space-y-8">
				<h2 className="text-3xl font-bold text-white text-center">Sign In</h2>
				{!sent ? (
					<form onSubmit={handleSubmit} className="space-y-6">
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter your email"
							className="w-full h-10 rounded-md border border-gray-700 bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 focus:outline-none text-white"
						/>
						<Button
							type="submit"
							variant="default"
							size="lg"
							disabled={loading || !email}
							className="w-full h-12 rounded-md border border-gray-700 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 text-white">
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Sending OTP...
								</>
							) : (
								"Send OTP"
							)}
						</Button>
					</form>
				) : (
					<form onSubmit={handleOTPSubmit} className="space-y-6">
						<Input
							type="text"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							placeholder="Enter OTP"
							className="w-full h-10 rounded-md border border-gray-700 bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all duration-200 focus:outline-none text-white"
						/>
						<Button
							type="submit"
							variant="default"
							size="lg"
							disabled={loading || !otp}
							className="w-full h-12 rounded-md border border-gray-700 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 text-white">
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify OTP"
							)}
						</Button>
					</form>
				)}
			</div>
		</div>
	);
};

export default SignIn;
