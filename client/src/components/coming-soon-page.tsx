
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface ComingSoonPageProps {
  message?: string;
}

export function ComingSoonPage({ message = "Our platform is coming soon. Stay tuned for updates!" }: ComingSoonPageProps) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Coming Soon</CardTitle>
          <CardDescription className="text-center">
            We're working on something awesome
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription className="text-center">
              {message}
            </AlertDescription>
          </Alert>
          
          {user?.isAdmin && (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                You're seeing this as an admin. Normal users cannot access the application while coming soon mode is enabled.
              </p>
              
              <div className="flex justify-center">
                <Link href="/admin/maintenance">
                  <Button variant="outline" size="sm">
                    Disable Coming Soon Mode
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
