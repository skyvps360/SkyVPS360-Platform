import * as React from "react";
import { useQuery } from "@tanstack/react-query";
// Fix import to use client-side schema definition
import { Volume } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Define schema locally or import from types folder instead of @shared/schema
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

// Map regions to flag emojis
const regionFlags: { [key: string]: string } = {
  'nyc1': '🇺🇸 New York',
  'nyc2': '🇺🇸 New York',
  'nyc3': '🇺🇸 New York',
  'sfo3': '🇺🇸 San Francisco',
  'sfo2': '🇺🇸 San Francisco',
  'ams3': '🇳🇱 Amsterdam',
  'sgp1': '🇸🇬 Singapore',
  'lon1': '🇬🇧 London',
  'tor1': '🇨🇦 Toronto',
  'blr1': '🇮🇳 Bangalore',
  'syd1': '🇦🇺 Sydney',
};

const MAX_VOLUME_SIZE = 1000;

interface VolumeManagerProps {
  serverId: number;
}

export default function VolumeManager({ serverId }: VolumeManagerProps) {
  const { toast } = useToast();
  const [resizingVolume, setResizingVolume] = useState<Volume | null>(null);
  const [newSize, setNewSize] = useState<number>(0);
  const [volumeSize, setVolumeSize] = useState(10);

  const { data: volumes = [], isLoading } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
  });

  const form = useForm({
    resolver: zodResolver(insertVolumeSchema.extend({
      name: insertVolumeSchema.shape.name.refine(
        (name) => !volumes.some(v => v.name === name),
        "A volume with this name already exists on this server"
      )
    })),
    defaultValues: {
      name: "",
      size: 10,
    },
  });

  const handleSliderChange = (value: number[]) => {
    const newSize = value[0];
    setVolumeSize(newSize);
    form.setValue("size", newSize);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 10 && value <= MAX_VOLUME_SIZE) {
      setVolumeSize(value);
      form.setValue("size", value);
    }
  };

  async function onSubmit(values: any) {
    try {
      await apiRequest("POST", `/api/servers/${serverId}/volumes`, values);
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      form.reset();
      setVolumeSize(10);
      toast({
        title: "Volume created",
        description: "Your new volume is being provisioned",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  async function onDeleteVolume(volumeId: number) {
    try {
      await apiRequest("DELETE", `/api/servers/${serverId}/volumes/${volumeId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      toast({
        title: "Volume deleted",
        description: "Your volume has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  async function onResizeVolume(volumeId: number, newSize: number) {
    try {
      await apiRequest("PATCH", `/api/servers/${serverId}/volumes/${volumeId}`, { size: newSize });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      setResizingVolume(null);
      toast({
        title: "Volume resized",
        description: "Your volume is being resized",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {volumes.map((volume) => {
          const isMaxSize = volume.size >= MAX_VOLUME_SIZE;
          return (
            <div
              key={volume.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4"
            >
              <div className="space-y-2 flex-1">
                <h4 className="font-medium">{volume.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {volume.size}GB in {regionFlags[volume.region] || volume.region}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cost: ${(volume.size * 0.000208333).toFixed(5)}/hour (${(volume.size * 0.15).toFixed(2)}/month)
                </p>
                <div className="flex gap-2 mt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResizingVolume(volume);
                              setNewSize(volume.size);
                            }}
                            disabled={isMaxSize}
                          >
                            Resize
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMaxSize
                          ? "This volume has reached the maximum size limit of 1000GB"
                          : "Click to resize this volume"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Volume</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this volume? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteVolume(volume.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
        {volumes.length === 0 && (
          <p className="text-center text-muted-foreground">No volumes attached</p>
        )}
      </div>

      {resizingVolume && (
        <Dialog open={!!resizingVolume} onOpenChange={() => setResizingVolume(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Resize Volume</DialogTitle>
              <DialogDescription>
                Adjust the volume size. You can only increase the size, not decrease it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:flex-1">
                  <Slider
                    value={[newSize]}
                    min={resizingVolume.size}
                    max={Math.min(resizingVolume.size + 100, MAX_VOLUME_SIZE)}
                    step={10}
                    onValueChange={(value) => setNewSize(value[0])}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={newSize}
                    min={resizingVolume.size}
                    max={MAX_VOLUME_SIZE}
                    step={10}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= resizingVolume.size && value <= MAX_VOLUME_SIZE) {
                        setNewSize(value);
                      }
                    }}
                    className="w-24"
                  />
                  <span>GB</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                New cost: ${(newSize * 0.000208333).toFixed(5)}/hour (${(newSize * 0.15).toFixed(2)}/month)
              </p>
              <p className="text-sm text-muted-foreground">
                Difference: +${((newSize - resizingVolume.size) * 0.000208333).toFixed(5)}/hour (+${((newSize - resizingVolume.size) * 0.15).toFixed(2)}/month)
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResizingVolume(null)}>
                  Cancel
                </Button>
                <Button onClick={() => onResizeVolume(resizingVolume.id, newSize)}>
                  Resize Volume
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Add New Volume</h4>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a unique volume name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (GB)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Slider
                        value={[volumeSize]}
                        min={10}
                        max={MAX_VOLUME_SIZE}
                        step={10}
                        onValueChange={handleSliderChange}
                        className="py-4"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={volumeSize}
                          onChange={handleInputChange}
                          min={10}
                          max={MAX_VOLUME_SIZE}
                          step={10}
                          className="w-24"
                        />
                        <span>GB</span>
                      </div>
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cost: ${(volumeSize * 0.000208333).toFixed(5)}/hour (${(volumeSize * 0.15).toFixed(2)}/month)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Volume"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

// Define the insertVolumeSchema locally
const insertVolumeSchema = z.object({
  name: z.string().min(3, "Volume name must be at least 3 characters"),
  size: z.number().min(10, "Minimum volume size is 10GB"),
});
