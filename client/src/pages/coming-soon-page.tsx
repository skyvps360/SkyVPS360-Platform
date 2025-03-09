import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ComingSoonPageProps {
  message?: string;
}

export default function ComingSoonPage({ message }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-500" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {message || "This feature is coming soon. Stay tuned for updates!"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
