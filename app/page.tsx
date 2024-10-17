import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-8">Welcome to JIRA Client App</h1>
      <div className="space-x-4">
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/issues">View Issues</Link>
        </Button>
      </div>
    </div>
  );
}