import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    
    try {
      // Try to parse as JSON to get a structured error
      const json = JSON.parse(text);
      throw new Error(json.message || json.error || `${res.status}: ${res.statusText}`);
    } catch (e) {
      // If parsing fails, use the raw text
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrData?: string | unknown,
  data?: unknown | undefined,
): Promise<Response> {
  // Support both (method, url, data) and (url, method, data) formats
  let method: string;
  let url: string;
  let requestData: unknown | undefined;

  if (urlOrData && typeof urlOrData === 'string' && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(methodOrUrl)) {
    // New format: (url, method?, data?)
    url = methodOrUrl;
    method = urlOrData as string || 'GET';
    requestData = data;
  } else {
    // Old format: (method, url, data?)
    method = methodOrUrl;
    url = urlOrData as string;
    requestData = data;
  }

  const res = await fetch(url, {
    method,
    headers: requestData ? { "Content-Type": "application/json" } : {},
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Log the query being attempted to help with debugging
      console.log(`Fetching data for: ${queryKey[0]}`);
      
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.warn(`Authentication required for: ${queryKey[0]}`);
        return null;
      }

      // Check for 204 No Content response (valid but empty)
      if (res.status === 204) {
        return null;
      }

      // Handle errors
      await throwIfResNotOk(res);
      
      // Parse JSON response
      try {
        const data = await res.json();
        return data;
      } catch (parseError) {
        console.error(`Failed to parse JSON for ${queryKey[0]}:`, parseError);
        throw new Error(`Invalid JSON response from the server: ${parseError}`);
      }
    } catch (error) {
      console.error(`Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30000, // 30 seconds - more responsive UI
      retry: 2, // Increase retries
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
