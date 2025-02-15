"use client";

import { useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface IssueStatus {
	name: string;
}

interface IssueFiltersProps {
	onFilterChange: (filters: { query?: string; status?: string }) => void;
	availableStatuses?: IssueStatus[];
}

export default function IssueFilters({ onFilterChange, availableStatuses }: IssueFiltersProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
	const uniqueStatuses = Array.from(new Set(availableStatuses?.map((status) => status.name.toLowerCase()) || [])).sort();

	return (
		<div className="flex flex-col gap-4 mb-6 bg-background shadow-sm rounded-lg mx-[250px] p-4">
			<Input
				placeholder="Search by title, summary or description..."
				value={searchQuery}
				onChange={(e) => {
					setSearchQuery(e.target.value);
					onFilterChange({
						query: e.target.value.toLowerCase(),
					});
				}}
				className="border-border"
			/>

			<Select
				value={selectedStatus || ""}
				onValueChange={(value) => {
					setSelectedStatus(value);
					onFilterChange({
						status: value === "all" ? undefined : value,
					});
				}}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="All statuses" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectItem value="all">All statuses</SelectItem>
						{uniqueStatuses.map((status) => (
							<SelectItem key={status} value={status}>
								{status.charAt(0).toUpperCase() + status.slice(1)}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
