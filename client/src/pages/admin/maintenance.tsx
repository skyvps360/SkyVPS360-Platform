import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance');
      if (!response.ok) throw new Error('Failed to fetch maintenance settings');
      return response.json();
    }
  });

  const [localSettings, setLocalSettings] = useState({
    enabled: false,
    maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
    comingSoonEnabled: false,
    comingSoonMessage: ""
  });

  // Update local state when data is loaded
  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        enabled: settings.enabled || false,
        maintenanceMessage: settings.maintenanceMessage || "We're currently performing maintenance. Please check back soon.",
        comingSoonEnabled: false,
        comingSoonMessage: ""
      });
    }
  }, [settings]);

  const handleMaintenanceToggle = (checked: boolean) => {
    setLocalSettings({
      ...localSettings,
      enabled: checked
    });

    // Show toast notification
    if (checked) {
      toast.info('Maintenance mode will be enabled when you save changes');
    } else {
      toast.info('Maintenance mode will be disabled when you save changes');
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: typeof localSettings & { updatedBy: number }) => {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update maintenance settings');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      if (data.enabled) {
        toast.success('Maintenance mode enabled successfully');
      } else if (data.comingSoonEnabled) {
        toast.success('Coming Soon mode enabled successfully');
      } else {
        toast.success('Settings updated successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to update maintenance settings: ' + (error as Error).message);
    }
  });

  const handleSave = () => {
    if (!user?.id) {
      toast.error('User ID not found');
      return;
    }

    mutation.mutate({
      ...localSettings,
      updatedBy: user.id
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Heading title="Maintenance Mode Settings" description="Configure maintenance mode and customize messages shown to users" />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable to show maintenance page to non-admin users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              When maintenance mode is enabled, only admin users can access the platform.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            <Switch 
              id="maintenance-mode" 
              checked={localSettings.enabled}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea 
              id="maintenance-message" 
              rows={4}
              value={localSettings.maintenanceMessage}
              onChange={(e) => setLocalSettings({...localSettings, maintenanceMessage: e.target.value})}
              placeholder="Enter message to show during maintenance"
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown to logged-out users and normal users
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}