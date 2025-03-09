import React, { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, ExternalLink, HardDrive, Loader2, Unlink } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminVolume {
  id: number;
  userId: number;
  serverId: number | null;
  name: string;
  volumeId: string;
  sizeGb: number;
  region: string;
}

interface VolumeStats {
  totalStorage: number;
  attachedStorage: number;
  unattachedStorage: number;
  volumeCount: number;
  attachedVolumeCount: number;
  unattachedVolumeCount: number;
}

interface VolumeManagementProps {
  volumes: AdminVolume[] | undefined;
  volumesLoading: boolean;
  volumeStats: VolumeStats | undefined;
  volumeStatsLoading: boolean;
}

export default function VolumeManagement({
  volumes,
  volumesLoading,
  volumeStats,
  volumeStatsLoading
}: VolumeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filter volumes based on search term and filter value
  const filteredVolumes = React.useMemo(() => {
    if (!volumes) return [];
    
    return volumes.filter(volume => {
      // Search filter
      const matchesSearch = 
        searchTerm === '' || 
        volume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volume.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volume.volumeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesFilter = 
        filterValue === 'all' || 
        (filterValue === 'attached' && volume.serverId !== null) ||
        (filterValue === 'unattached' && volume.serverId === null);
      
      return matchesSearch && matchesFilter;
    });
  }, [volumes, searchTerm, filterValue]);
  
  // Pagination logic
  const paginatedVolumes = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVolumes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVolumes, currentPage]);
  
  const totalPages = Math.ceil(filteredVolumes.length / ITEMS_PER_PAGE);

  return (
    <>
      {/* Volume Analytics Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Volume Analytics</CardTitle>
          <CardDescription>Overview of storage usage across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {volumeStatsLoading ? (
            <div className="flex justify-center p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading volume statistics...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Storage</span>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {volumeStats?.totalStorage} GB
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {volumeStats?.volumeCount} volumes total
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Attached Storage</span>
                    <div className="h-4 w-4 text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">
                    {volumeStats?.attachedStorage} GB
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {volumeStats?.attachedVolumeCount} attached volumes
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Unattached Storage</span>
                    <Unlink className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {volumeStats?.unattachedStorage} GB
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {volumeStats?.unattachedVolumeCount} unattached volumes
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Volume Management Section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Volume Management</CardTitle>
          <CardDescription>Manage attached and unattached volumes across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <Input 
              placeholder="Search volumes by name or region..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
            
            <div className="flex gap-2">
              <Select 
                value={filterValue}
                onValueChange={(value) => {
                  setFilterValue(value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter volumes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volumes</SelectItem>
                  <SelectItem value="attached">Attached Volumes</SelectItem>
                  <SelectItem value="unattached">Unattached Volumes</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => window.open('https://cloud.digitalocean.com/volumes', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open DO Console</span>
              </Button>
            </div>
          </div>
          
          <Table>
            <TableCaption>List of all storage volumes on the platform</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Size (GB)</TableHead>
                <TableHead>Server ID</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volume ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volumesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading volumes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !paginatedVolumes.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    {filteredVolumes.length === 0 && searchTerm !== '' ? 
                      `No volumes found matching "${searchTerm}"` : 
                      'No volumes found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVolumes.map((volume: AdminVolume) => (
                  <TableRow key={volume.id}>
                    <TableCell>{volume.id}</TableCell>
                    <TableCell>{volume.name}</TableCell>
                    <TableCell>{volume.sizeGb ? `${volume.sizeGb} GB` : "10 GB"}</TableCell>
                    <TableCell>
                      {volume.serverId ? (
                        <Link to={`/servers/${volume.serverId}`} className="text-blue-500 hover:underline">
                          {volume.serverId}
                        </Link>
                      ) : (
                        <Badge variant="outline">Unattached</Badge>
                      )}
                    </TableCell>
                    <TableCell>{volume.region}</TableCell>
                    <TableCell>
                      <Badge variant={volume.serverId ? "default" : "secondary"}>
                        {volume.serverId ? "Attached" : "Unattached"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{volume.volumeId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {volume.serverId ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            title="Detach volume from server"
                            onClick={() => {
                              window.open(`/servers/${volume.serverId}`, '_blank');
                            }}
                          >
                            Detach
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled
                            title="Volume is already detached"
                          >
                            Attach
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            window.open(`/servers/${volume.serverId}`, '_blank');
                          }}
                        >
                          Resize
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          title="Permanently delete volume"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this volume? This action cannot be undone.")) {
                              window.open(`/servers/${volume.serverId}`, '_blank');
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Control */}
          <div className="flex items-center justify-end space-x-2 py-4 mt-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {filteredVolumes.length > 0 
                ? `Showing ${Math.min(ITEMS_PER_PAGE, paginatedVolumes.length)} of ${filteredVolumes.length} volume${filteredVolumes.length === 1 ? '' : 's'}`
                : 'No volumes found'}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}