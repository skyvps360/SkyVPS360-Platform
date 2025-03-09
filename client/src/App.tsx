import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster } from "@/components/ui/toaster";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import MaintenancePage from "@/pages/maintenance-page";
import ComingSoonPage from "@/pages/coming-soon-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import BillingPage from "@/pages/billing-page";
import SupportPage from "@/pages/support-page";
import VolumesPage from "@/pages/volumes-page";
import ServerDetailPage from "@/pages/server-detail";
import TerminalPage from "@/pages/terminal-page";
import BandwidthDetailsPage from "@/pages/bandwidth-details";
import AccountPage from "@/pages/account-page";
import ApiKeyPage from "@/pages/api-key-page";
import DocsPage from "@/pages/docs-page";
import ApiDocsPage from "@/pages/api-docs-page";
import AdminDashboard from "@/pages/admin/dashboard";
import MaintenanceSettings from "@/pages/admin/maintenance";
import GitHubSetupPage from "@/pages/github-setup";
import DeploymentsPage from "@/pages/deployments";
import GitHubDebugPage from "@/pages/github-debug";
import GitHubGuidePage from "./pages/github-guide";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Button } from "@/components/ui/button";
import { Home, ShieldCheck, Settings, Book, Key, Wrench, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect } from "react";
import './App.css';

// If there are any imports referencing GitHubConnectButton, update them to GitHubConnect
import GitHubConnect from "./components/github-connect";

function Nav() {
  const { user } = useAuth();

  // Setup theme on initial load
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      }
    }
  }, []);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!user ? (
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          )}
          <Link href="/docs">
            <Button variant="ghost" size="sm">
              <Book className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </Link>
          {user && (
            <Link href="/my-api">
              <Button variant="ghost" size="sm">
                <Key className="h-4 w-4 mr-2" />
                API Key
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && user.isAdmin && (
            <>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
              <Link href="/admin/maintenance">
                <Button variant="ghost" size="sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  Maintenance
                </Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const { user } = useAuth();

  // Query maintenance mode settings using public endpoint
  const { data: maintenanceSettings } = useQuery({
    queryKey: ['/api/maintenance'],
    // Return undefined if the query fails
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

  // Check if current path is /auth to allow authentication even during maintenance
  const [currentPath] = useLocation();
  const isAuthPage = currentPath === '/auth';

  // If maintenance mode is enabled and user is not admin, and we're not on auth page
  if (maintenanceSettings?.enabled && (!user || !user.isAdmin) && !isAuthPage) {
    return <MaintenancePage message={maintenanceSettings.maintenanceMessage} />;
  }

  // If coming soon mode is enabled
  if (maintenanceSettings?.comingSoonEnabled && !isAuthPage) {
    return <ComingSoonPage message={maintenanceSettings.comingSoonMessage} />;
  }

  return (
    <>
      <Nav />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/deployments" component={DeploymentsPage} />
        <Route path="/github-debug" component={GitHubDebugPage} />
        <Route path="/github-guide" component={GitHubGuidePage} />
        <ProtectedRoute path="/api-docs" component={ApiDocsPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/billing" component={BillingPage} />
        <ProtectedRoute path="/support" component={SupportPage} />
        <ProtectedRoute path="/support/:id" component={SupportPage} />
        <ProtectedRoute path="/account" component={AccountPage} />
        <ProtectedRoute path="/my-api" component={ApiKeyPage} />
        <ProtectedRoute path="/github-setup" component={GitHubSetupPage} />
        <ProtectedRoute path="/admin" component={AdminDashboard} />
        <ProtectedRoute path="/admin/maintenance" component={MaintenanceSettings} />
        {/* Server routes */}
        <ProtectedRoute path="/servers/:id" component={ServerDetailPage} />
        <ProtectedRoute path="/servers/:id/bandwidth-details" component={BandwidthDetailsPage} />
        <ProtectedRoute path="/terminal/:serverId" component={TerminalPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// Main App component
function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <PayPalScriptProvider options={{
          clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
          currency: "USD",
          intent: "capture",
          components: "buttons,marks",
        }}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </PayPalScriptProvider>
      </QueryClientProvider>
    </>
  );
}

// If there are any hardcoded links to /account#github for GitHub connection, update them to /github-guide
// For example, this might be in a navigation menu or other components

export default App;