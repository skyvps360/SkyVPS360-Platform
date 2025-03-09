import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { GitHubButton } from "@/components/github-button";
import { ModeToggle } from "@/components/mode-toggle";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <MainNav />
          <div className="flex items-center space-x-3">
            <GitHubButton />
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
