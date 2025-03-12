import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  size: number;
}

interface SnapshotManagerProps {
  serverId: number;
}

export default function SnapshotManager({ serverId }: SnapshotManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [snapshotName, setSnapshotName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch snapshots
  const { data: snapshots = [], isLoading } = useQuery<Snapshot[]>({
    queryKey: [`/api/servers/${serverId}/snapshots`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/servers/${serverId}/snapshots`);
      return response.json();
    }
  });

  // Create snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", `/api/servers/${serverId}/snapshots`, { name });
    },
    onSuccess: () => {
      toast({
        title: "Snapshot created",
        description: "Your snapshot is being created. This may take a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/snapshots`] });
      setSnapshotName("");
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create snapshot",
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  // Delete snapshot mutation
  const deleteSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      return await apiRequest("DELETE", `/api/servers/${serverId}/snapshots/${snapshotId}`);
    },
    onSuccess: () => {
      toast({
        title: "Snapshot deleted",
        description: "The snapshot has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/snapshots`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete snapshot",
        variant: "destructive",
      });
    },
  });

  // Restore snapshot mutation
  const restoreSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      return await apiRequest("POST", `/api/servers/${serverId}/snapshots/${snapshotId}/restore`);
    },
    onSuccess: () => {
      toast({
        title: "Restoration started",
        description: "Your server is being restored from the snapshot. This may take several minutes.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore snapshot",
        variant: "destructive",
      });
    },
  });

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a snapshot name",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    await createSnapshotMutation.mutate(snapshotName.trim());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter snapshot name"
          value={snapshotName}
          onChange={(e) => setSnapshotName(e.target.value)}
          disabled={isCreating}
        />
        <Button
          onClick={handleCreateSnapshot}
          disabled={isCreating || !snapshotName.trim()}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Camera className="h-4 w-4 mr-2" />
          )}
          Create Snapshot
        </Button>
      </div>

      {snapshots.length > 0 ? (
        <div className="space-y-2">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div>
                <div className="font-medium">{snapshot.name}</div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(snapshot.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restore from Snapshot</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restore your server to this snapshot's state. This action cannot be undone.
                        Your current server state will be lost unless you create a new snapshot first.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => restoreSnapshotMutation.mutate(snapshot.id)}
                      >
                        Restore Server
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Snapshot</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this snapshot? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSnapshotMutation.mutate(snapshot.id)}
                      >
                        Delete Snapshot
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          No snapshots available. Create a snapshot to save your server's current state.
        </div>
      )}
    </div>
  );
}