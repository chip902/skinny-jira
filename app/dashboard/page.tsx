import TicketTracker from "@/components/TicketTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle>Track Your Support Tickets</CardTitle>
				<CardDescription>Enter your email to view all your submitted tickets</CardDescription>
			</CardHeader>
			<CardContent>
				<TicketTracker />
			</CardContent>
		</Card>
	);
};

export default Dashboard;
