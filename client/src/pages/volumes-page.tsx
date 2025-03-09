import { useQuery } from "@tanstack/react-query";
import { Volume } from "@/types/schema";
import VolumeManager from "@/components/volume-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function VolumesPage() {
  const [search, setSearch] = useState("");
  const { data: volumes = [], isLoading } = useQuery<Volume[]>({
    queryKey: ["/api/volumes"],
  });

  const filteredVolumes = volumes.filter(volume => 
    volume.name.toLowerCase().includes(search.toLowerCase()) ||
    volume.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Storage Volumes</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <h2 className="text-3xl font-bold">Your Volumes</h2>
          <Input 
            placeholder="Search volumes by name or region..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="space-y-4 mt-6">
          {filteredVolumes.map((volume) => (
            <Card key={volume.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{volume.name}</CardTitle>
                    <CardDescription>
                      {volume.size}GB in {volume.region}
                    </CardDescription>
                  </div>
                  <Link href={`/servers/${volume.serverId}`}>
                    <Button variant="outline" size="sm">
                      View Server
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <VolumeManager serverId={volume.serverId} />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}