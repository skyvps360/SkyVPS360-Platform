import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ApiDocsPage() {
  const { user } = useAuth();
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  // Function to format example code blocks
  const CodeExample = ({
    endpoint,
    method,
    description,
    requestSample,
    responseSample,
  }: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    description: string;
    requestSample?: string;
    responseSample: string;
  }) => {
    const baseUrl = import.meta.env.DEV
      ? "http://skyvps360.com"
      : window.location.origin;
    const fullEndpoint = `${baseUrl}${endpoint}`;
    const isCopied = copiedEndpoint === endpoint;

    const requestCode = requestSample
      ? `curl -X ${method} ${fullEndpoint} \\
-H "X-API-Key: YOUR_API_KEY"${
          requestSample
            ? ` \\
-H "Content-Type: application/json" \\
-d '${requestSample}'`
            : ""
        }`
      : `curl -X ${method} ${fullEndpoint} \\
-H "X-API-Key: YOUR_API_KEY"`;

    return (
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1 flex items-center">
              <span
                className={
                  method === "GET"
                    ? "text-blue-500"
                    : method === "POST"
                      ? "text-green-500"
                      : method === "PUT"
                        ? "text-amber-500"
                        : "text-red-500"
                }
              >
                {method}
              </span>
              <span className="mx-2">{endpoint}</span>
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => copyToClipboard(requestCode, endpoint)}
          >
            {isCopied ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Request</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
              <code>{requestCode}</code>
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
              <code>{responseSample}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/my-api">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to API Key Management
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            SkyVPS360 API Documentation
          </h1>
          <p className="text-muted-foreground">
            Comprehensive guide for integrating your applications with the
            SkyVPS360 API
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  <a
                    href="#authentication"
                    className="block p-2 hover:bg-muted rounded-md"
                  >
                    Authentication
                  </a>
                  <a
                    href="#servers"
                    className="block p-2 hover:bg-muted rounded-md"
                  >
                    Servers
                  </a>
                  <a
                    href="#volumes"
                    className="block p-2 hover:bg-muted rounded-md"
                  >
                    Volumes
                  </a>
                  <a
                    href="#billing"
                    className="block p-2 hover:bg-muted rounded-md"
                  >
                    Billing
                  </a>
                  <a
                    href="#account"
                    className="block p-2 hover:bg-muted rounded-md"
                  >
                    Account
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card id="authentication">
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  All API requests require authentication with your API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Your API key grants full access to your account. Keep it
                    secure and never share it. Regenerate your key immediately
                    if you suspect it has been compromised.
                  </AlertDescription>
                </Alert>

                <h3 className="text-lg font-semibold">API Key Header</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Include your API key in all requests using the{" "}
                  <code className="bg-muted px-1 rounded">X-API-Key</code>{" "}
                  header.
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                  <code>
                    {`curl -X GET ${import.meta.env.DEV ? "http://skynet360.com" : window.location.origin}/api/servers \\
-H "X-API-Key: YOUR_API_KEY"`}
                  </code>
                </pre>
              </CardContent>
            </Card>

            <Card id="servers">
              <CardHeader>
                <CardTitle>Servers</CardTitle>
                <CardDescription>
                  Endpoints for managing your virtual servers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeExample
                  endpoint="/api/servers"
                  method="GET"
                  description="List all servers in your account"
                  responseSample={`{
  "servers": [
    {
      "id": 123,
      "name": "web-server-1",
      "status": "active",
      "region": "nyc1",
      "size": "s-1vcpu-1gb",
      "ip_address": "123.456.789.10",
      "droplet_id": "32756325",
      "created_at": "2023-05-15T14:32:20Z"
    },
    {
      "id": 124,
      "name": "database-server",
      "status": "active",
      "region": "tor1",
      "size": "s-2vcpu-4gb",
      "ip_address": "123.456.789.11",
      "droplet_id": "32859372",
      "created_at": "2023-05-16T09:15:43Z"
    }
  ]
}`}
                />

                <CodeExample
                  endpoint="/api/servers/{server_id}"
                  method="GET"
                  description="Get detailed information about a specific server"
                  responseSample={`{
  "server": {
    "id": 123,
    "name": "web-server-1",
    "status": "active",
    "region": "nyc1",
    "size": "s-1vcpu-1gb",
    "ip_address": "123.456.789.10",
    "ipv6_address": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    "droplet_id": "32756325",
    "specs": {
      "memory": 1024,
      "vcpus": 1,
      "disk": 25
    },
    "application": "nodejs",
    "created_at": "2023-05-15T14:32:20Z",
    "last_monitored": "2023-06-01T12:00:05Z"
  }
}`}
                />

                <CodeExample
                  endpoint="/api/servers"
                  method="POST"
                  description="Create a new server"
                  requestSample={`{
  "name": "new-server",
  "region": "nyc1",
  "size": "s-1vcpu-1gb",
  "application": "nodejs"
}`}
                  responseSample={`{
  "server": {
    "id": 125,
    "name": "new-server",
    "status": "new",
    "region": "nyc1",
    "size": "s-1vcpu-1gb",
    "droplet_id": "32956148",
    "created_at": "2023-06-01T15:43:22Z"
  }
}`}
                />

                <CodeExample
                  endpoint="/api/servers/{server_id}/reboot"
                  method="POST"
                  description="Reboot a server"
                  responseSample={`{
  "success": true,
  "message": "Server reboot initiated",
  "server_id": 123
}`}
                />

                <CodeExample
                  endpoint="/api/servers/{server_id}"
                  method="DELETE"
                  description="Delete a server"
                  responseSample={`{
  "success": true,
  "message": "Server deletion initiated",
  "server_id": 123
}`}
                />
              </CardContent>
            </Card>

            <Card id="volumes">
              <CardHeader>
                <CardTitle>Volumes</CardTitle>
                <CardDescription>
                  Endpoints for managing block storage volumes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeExample
                  endpoint="/api/volumes"
                  method="GET"
                  description="List all volumes in your account"
                  responseSample={`{
  "volumes": [
    {
      "id": 45,
      "name": "data-volume-1",
      "size": 100,
      "region": "nyc1",
      "server_id": 123,
      "volume_id": "8d91899c-0020-11ec-9a03-0242ac130003"
    },
    {
      "id": 46,
      "name": "backup-volume",
      "size": 250,
      "region": "nyc1",
      "server_id": 124,
      "volume_id": "9e72456a-0020-11ec-9a03-0242ac130003"
    }
  ]
}`}
                />

                <CodeExample
                  endpoint="/api/volumes/{volume_id}"
                  method="GET"
                  description="Get detailed information about a specific volume"
                  responseSample={`{
  "volume": {
    "id": 45,
    "name": "data-volume-1",
    "size": 100,
    "region": "nyc1",
    "server_id": 123,
    "volume_id": "8d91899c-0020-11ec-9a03-0242ac130003"
  }
}`}
                />

                <CodeExample
                  endpoint="/api/volumes"
                  method="POST"
                  description="Create a new volume"
                  requestSample={`{
  "name": "new-volume",
  "size": 50,
  "region": "nyc1",
  "server_id": 123
}`}
                  responseSample={`{
  "volume": {
    "id": 47,
    "name": "new-volume",
    "size": 50,
    "region": "nyc1",
    "server_id": 123,
    "volume_id": "a5f3217e-0020-11ec-9a03-0242ac130003"
  }
}`}
                />

                <CodeExample
                  endpoint="/api/volumes/{volume_id}"
                  method="DELETE"
                  description="Delete a volume"
                  responseSample={`{
  "success": true,
  "message": "Volume deletion initiated",
  "volume_id": 45
}`}
                />
              </CardContent>
            </Card>

            <Card id="billing">
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>
                  Endpoints for accessing billing information and transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeExample
                  endpoint="/api/billing/balance"
                  method="GET"
                  description="Get your current account balance"
                  responseSample={`{
  "balance": 120.50,
  "currency": "USD",
  "last_updated": "2023-06-01T12:00:00Z"
}`}
                />

                <CodeExample
                  endpoint="/api/billing/transactions"
                  method="GET"
                  description="List your recent billing transactions"
                  responseSample={`{
  "transactions": [
    {
      "id": 1001,
      "amount": 50.00,
      "currency": "USD",
      "type": "deposit",
      "status": "completed",
      "description": "Account deposit",
      "created_at": "2023-05-28T09:15:31Z"
    },
    {
      "id": 1002,
      "amount": -0.10,
      "currency": "USD",
      "type": "hourly_server_charge",
      "status": "completed",
      "description": "Hourly charge for \"web-server-1\"",
      "created_at": "2023-05-28T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 24,
    "page": 1,
    "limit": 10
  }
}`}
                />
              </CardContent>
            </Card>

            <Card id="account">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Endpoints for managing your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeExample
                  endpoint="/api/account"
                  method="GET"
                  description="Get your account information"
                  responseSample={`{
  "user": {
    "id": 5,
    "username": "example_user",
    "email": "user@example.com",
    "created_at": "2023-01-15T12:34:56Z"
  }
}`}
                />

                <CodeExample
                  endpoint="/api/account/api-key"
                  method="GET"
                  description="Get your current API key"
                  responseSample={`{
  "apiKey": "eb7ac29a4b3ab2a7458fa290207c72a48eb114b1c7d87e193bfacbf28c5bc42a"
}`}
                />

                <CodeExample
                  endpoint="/api/account/api-key"
                  method="POST"
                  description="Generate a new API key (invalidates the current key)"
                  requestSample={`{
  "password": "your_current_password"
}`}
                  responseSample={`{
  "apiKey": "a4fc21e9d87b5e30c92f6a491d7e3b5f0a9c87d2e1f3b5a7c9e1d3f5a7b9c1e3",
  "message": "API key generated successfully"
}`}
                />
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Link href="/my-api">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to API Key Management
                </Button>
              </Link>
              <a
                href="https://digitalocean.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  DigitalOcean Documentation
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
