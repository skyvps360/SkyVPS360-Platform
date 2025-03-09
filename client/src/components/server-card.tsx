import { Server } from "@/types/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Trash2, Server as ServerIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RegionDisplay from "@/components/RegionDisplay"; // Import the RegionDisplay component


interface ServerCardProps {
  server: Server;
}

export default function ServerCard({ server }: ServerCardProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function deleteServer() {
    try {
      await apiRequest("DELETE", `/api/servers/${server.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: "Server deleted",
        description: "Your server has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  const specs = server.specs || { memory: 0, vcpus: 0, disk: 0 };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{server.name}</CardTitle>
        <Badge
          variant={server.status === "active" ? "default" : "secondary"}
          className="mt-2 sm:mt-0"
        >
          {server.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span>{specs.memory / 1024}GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">vCPUs</span>
                <span>{specs.vcpus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span>{specs.disk}GB</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono">{server.ipAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Region</span>
                <RegionDisplay regionSlug={server.region} /> {/* Replaced simple span with RegionDisplay component */}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="default" 
              className="flex-1"
              asChild
            >
              <Link href={`/servers/${server.id}`}>
                <ServerIcon className="h-4 w-4 mr-2" />
                Manage Server
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Server</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this server? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteServer}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}