import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KeyRound } from "lucide-react";

/**
 * Terminal Access Notice Component
 * 
 * This component shows an informational banner about password authentication for terminal access.
 */
export function CloudRackTerminalNotice() {
  return (
    <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-500" />
      <AlertTitle className="text-blue-800 dark:text-blue-400">Terminal Password Authentication</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <p className="mt-2">
          SkyVPS360 uses secure password authentication for terminal access to your VPS servers. 
          The root password you set during server creation is used to authenticate your terminal 
          sessions directly from the SkyVPS360 web interface.
        </p>
        <p className="mt-2">
          <strong>How it works:</strong> When you create a new server, your chosen root password is securely stored 
          and used for authentication when accessing your server through SSH or the web terminal. For security, 
          make sure to use a strong, unique password for each server.
        </p>
      </AlertDescription>
    </Alert>
  );
}