import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MaintenancePageProps {
  customMessage?: string;
  redirectPath?: string;
  bypassPaths?: string[];
}

export function MaintenancePage({ 
  customMessage, 
  redirectPath = '/dashboard',
  bypassPaths = ['/auth', '/logout', '/admin/maintenance']
}: MaintenancePageProps) {
  const { user } = useAuth();
  const currentPath = window.location.pathname;

  // Get maintenance settings
  const { data: maintenanceSettings } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (!response.ok) return undefined;
        return response.json();
      } catch (error) {
        return undefined;
      }
    }
  });

  // If user is admin, maintenance mode is disabled, or current path is in bypass list, return null
  if (
    (user?.isAdmin) || 
    !maintenanceSettings?.enabled ||
    bypassPaths.includes(currentPath)
  ) {
    return null;
  }

  const message = customMessage || maintenanceSettings?.maintenanceMessage || "We're currently performing maintenance. Please check back soon.";

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl">Maintenance Mode</CardTitle>
          <CardDescription>
            System Maintenance in Progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex flex-col gap-2 mt-4">
            {user ? (
              <>
                <Link href={redirectPath}>
                  <Button className="w-full" variant="default">
                    Return to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// HOC to wrap pages that should show maintenance page
export function withMaintenance(Component: React.ComponentType, options: MaintenancePageProps = {}) {
  return function MaintenanceWrapper(props: any) {
    const maintenancePage = <MaintenancePage {...options} />;
    if (maintenancePage === null) {
      return <Component {...props} />;
    }
    return maintenancePage;
  };
}
