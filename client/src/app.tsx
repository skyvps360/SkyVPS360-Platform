import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { GitHubProvider } from "@/contexts/github-context";
import Dashboard from "./pages/dashboard";
import AccountPage from "./pages/account";
import GitHubGuidePage from "./pages/github-guide";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <GitHubProvider>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/account" component={AccountPage} />
              <Route path="/github-guide" component={GitHubGuidePage} />
            </Switch>
            <Toaster />
          </GitHubProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
