"use client";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
	email: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LandingPage() {
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = async (data: FormValues) => {
		try {
			const response = await fetch("/api/generate-token", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			// Handle response
		} catch (error) {
			// Handle error
		}
	};

	return (
		<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center space-y-6 flex flex-col items-center justify-center">
			<h1 className="text-3xl font-bold text-gray-800">Exclusive Experience</h1>
			<p className="text-gray-600">Enter your email to access exclusive content</p>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input type="email" placeholder="Enter your email" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md">
						Submit
					</button>
				</form>
			</Form>
		</div>
	);
}
