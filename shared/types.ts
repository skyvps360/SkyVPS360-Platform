// Add GitHub repository types for better type safety

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  default_branch: string;
  language: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubDeployment {
  serverId: number;
  repoFullName: string;
  branch: string;
}
