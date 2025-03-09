import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <CardTitle>SkyVPS360 Is Currently Under Maintenance</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {message || "We're currently performing maintenance. Please check back soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
