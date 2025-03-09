import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Check, Copy, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const apiKeyRegenerationSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type ApiKeyFormValues = z.infer<typeof apiKeyRegenerationSchema>;

export default function ApiKeyPage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Define the type for our API key response
  interface ApiKeyResponse {
    apiKey: string | null;
  }

  // Use react-query to fetch the API key
  const { data, isLoading } = useQuery<ApiKeyResponse>({
    queryKey: ["/api/account/api-key"],
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyRegenerationSchema),
    defaultValues: {
      password: "",
    },
  });

  // Define response type for the regenerate mutation
  interface RegenerateKeyResponse {
    apiKey: string;
    message: string;
  }

  // Create a mutation for regenerating the API key
  const regenerateKeyMutation = useMutation<
    RegenerateKeyResponse,
    Error,
    ApiKeyFormValues
  >({
    mutationFn: async (values: ApiKeyFormValues) => {
      const response = await apiRequest("POST", "/api/account/api-key", values);
      return response as unknown as RegenerateKeyResponse;
    },
    onSuccess: () => {
      toast({
        title: "API Key Regenerated",
        description: "Your API key has been successfully regenerated",
      });
      form.reset();
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ["/api/account/api-key"] });
    },
    onError: (error) => {
      setServerError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to copy API key to clipboard
  const copyApiKey = () => {
    if (data?.apiKey) {
      navigator.clipboard.writeText(data.apiKey);
      setCopied(true);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handler for form submission
  const onSubmit = (values: ApiKeyFormValues) => {
    setServerError(null);
    regenerateKeyMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>API Key Management</CardTitle>
            <CardDescription>
              View and manage your SkyVPS360 API key for integration with
              external services
            </CardDescription>
          </CardHeader>
          <CardContent>
            {serverError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Current API Key Display */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Your API Key</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This key grants full access to your account via the SkyVPS360
                API. Keep it secure and never share it.
              </p>

              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    value={
                      isLoading
                        ? "Loading..."
                        : data?.apiKey || "No API key generated"
                    }
                    readOnly
                    className="pr-10 font-mono"
                  />
                  {data?.apiKey && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0"
                      onClick={copyApiKey}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Regenerate API Key Form */}
            <div>
              <h3 className="text-lg font-medium mb-2">Regenerate API Key</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Regenerating your API key will invalidate your existing key. Any
                applications using the old key will stop working.
              </p>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enter your password to confirm</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={regenerateKeyMutation.isPending}
                  >
                    {regenerateKeyMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Regenerate API Key
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        {/* API Documentation */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>API Usage Guide</CardTitle>
            <CardDescription>
              Learn how to authenticate and use the SkyVPS360 API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h3>Authentication</h3>
              <p>
                Include your API key in the <code>X-API-Key</code> header with
                every request:
              </p>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>
                  {`curl -X GET https://skyvps360.com/api/servers \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </code>
              </pre>

              <h3>Examples</h3>

              <h4>List Servers</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>
                  {`curl -X GET https://skyvps360.com/api/servers \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </code>
              </pre>

              <h4>Get Server Details</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>
                  {`curl -X GET https://skyvps360.com/api/servers/SERVER_ID \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </code>
              </pre>

              <h4>Reboot Server</h4>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>
                  {`curl -X POST https://skyvps360.com/api/servers/SERVER_ID/reboot \\
  -H "X-API-Key: YOUR_API_KEY"`}
                </code>
              </pre>

              <p>
                For more detailed API documentation, please visit our
                <a
                  href="/api-docs"
                  className="ml-1 text-primary hover:underline"
                >
                  API Documentation page
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
