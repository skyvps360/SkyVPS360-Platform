import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
}

interface GitHubContextType {
  isConnected: boolean;
  isLoading: boolean;
  repos: GitHubRepo[];
  connectGitHub: () => Promise<void>;
  disconnectGitHub: () => Promise<void>;
}

const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export function GitHubProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if GitHub is connected by attempting to fetch repos
  const { data: repos = [], isLoading, isError } = useQuery<GitHubRepo[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isConnected = repos.length > 0 && !isError;

  async function connectGitHub() {
    try {
      setIsConnecting(true);
      const response = await apiRequest("GET", "/api/github/auth-url");
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnectGitHub() {
    try {
      await apiRequest("POST", "/api/github/disconnect");
      queryClient.invalidateQueries({ queryKey: ["/api/github/repos"] });
      toast({
        title: "Success",
        description: "GitHub account disconnected successfully",
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  const value = {
    isConnected,
    isLoading,
    repos,
    connectGitHub,
    disconnectGitHub,
  };

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  );
}

export function useGitHub() {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error("useGitHub must be used within a GitHubProvider");
  }
  return context;
}
