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

// Combined and improved apiRequest function
export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  customHeaders?: Record<string, string>
) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    // Log errors for debugging
    if (!response.ok) {
      console.error(`API Error (${method} ${url}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      // Try to get error details from response
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('No JSON error details available');
      }
    }

    return response;
  } catch (error) {
    console.error(`Network Error (${method} ${url}):`, error);
    throw error;
  }
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
      queryFn: async ({ queryKey }) => {
        if (typeof queryKey[0] === 'string' && queryKey[0].startsWith('/api')) {
          console.log('Fetching data for:', queryKey[0]);
          // THIS IS THE FIX: Parse the response JSON before returning
          const response = await apiRequest('GET', queryKey[0] as string);

          // For 204 responses (No Content)
          if (response.status === 204) {
            return null;
          }

          // Handle non-OK responses
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          // Parse and return the JSON
          try {
            return await response.json();
          } catch (error) {
            console.error('Failed to parse response as JSON:', error);
            throw new Error('Invalid JSON in API response');
          }
        }
        return null;
      },
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
