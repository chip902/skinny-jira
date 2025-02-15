"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignIn() {
	const [authType, setAuthType] = useState<"login" | "register" | "reset">("login");
	const [step, setStep] = useState<"initial" | "otp" | "password">("initial");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [otp, setOTP] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (authType === "login") {
				// Try login with password first
				const result = await signIn("credentials", {
					email,
					password,
					authType: "login",
					redirect: false,
				});

				if (result?.error === "ACCOUNT_NOT_REGISTERED") {
					setError("Account not found. Please register first.");
					return;
				}

				if (result?.error && result.error !== "OTP_SENT") {
					setError(result.error);
					return;
				}

				if (result?.ok) {
					window.location.href = "/issues";
					return;
				}
			}

			// For registration, reset, or failed login, send OTP
			const result = await signIn("credentials", {
				email,
				step: "request-otp",
				authType,
				redirect: false,
			});

			if (result?.error === "OTP_SENT") {
				setStep("otp");
			} else if (result?.error) {
				setError(result.error);
			}
		} catch (err) {
			setError("Failed to process request. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleOTPSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await signIn("credentials", {
				email,
				otp,
				authType,
				redirect: false,
			});

			if (result?.error === "OTP_VERIFIED") {
				setStep("password");
			} else if (result?.error) {
				setError(result.error);
			} else if (result?.ok) {
				window.location.href = "/issues";
			}
		} catch (err) {
			setError("Failed to verify OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/set-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				throw new Error("Failed to set password");
			}

			// Login with the new password
			const result = await signIn("credentials", {
				email,
				password,
				authType: "login",
				redirect: false,
			});

			if (result?.error) {
				setError(result.error);
			} else if (result?.ok) {
				window.location.href = "/issues";
			}
		} catch (err) {
			setError("Failed to set password. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md mx-auto">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-center">
					{step === "password"
						? "Set Your Password"
						: step === "otp"
						? "Enter Verification Code"
						: authType === "register"
						? "Let's get you set up"
						: "Welcome Back"}
				</CardTitle>
				{step === "initial" && (
					<Tabs defaultValue={authType} onValueChange={(value) => setAuthType(value as typeof authType)}>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="login">Login</TabsTrigger>
							<TabsTrigger value="register">Register</TabsTrigger>
						</TabsList>
					</Tabs>
				)}
			</CardHeader>
			<CardContent>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{step === "initial" && (
					<form onSubmit={handleEmailSubmit} className="space-y-4">
						<div className="space-y-2">
							<Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
						</div>
						{authType === "login" && (
							<div className="space-y-2">
								<Input
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
								<Button type="button" variant="link" className="px-0" onClick={() => setAuthType("reset")}>
									Forgot password?
								</Button>
							</div>
						)}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Please wait..." : authType === "login" ? "Sign In" : authType === "register" ? "Register" : "Reset Password"}
						</Button>
					</form>
				)}

				{step === "otp" && (
					<form onSubmit={handleOTPSubmit} className="space-y-4">
						<CardDescription className="text-center">Enter the verification code sent to {email}</CardDescription>
						<Input
							type="text"
							placeholder="Enter 6-digit code"
							value={otp}
							onChange={(e) => {
								const value = e.target.value.replace(/[^0-9]/g, "");
								if (value.length <= 6) setOTP(value);
							}}
							maxLength={6}
							className="text-center text-xl tracking-wider"
							required
						/>
						<div className="flex justify-between">
							<Button type="button" variant="outline" onClick={() => setStep("initial")} disabled={loading}>
								Back
							</Button>
							<Button type="submit" disabled={loading || otp.length !== 6}>
								{loading ? "Verifying..." : "Verify Code"}
							</Button>
						</div>
					</form>
				)}

				{step === "password" && (
					<form onSubmit={handlePasswordSubmit} className="space-y-4">
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Enter new password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
							/>
						</div>
						<div className="space-y-2">
							<Input
								type="password"
								placeholder="Confirm new password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								minLength={8}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={loading || !password || password !== confirmPassword}>
							{loading ? "Setting password..." : "Set Password"}
						</Button>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
