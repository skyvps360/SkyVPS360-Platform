import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Cpu, Info } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  transfer: number;
  price_monthly: number;
  available?: boolean;
  processor_type?: 'regular' | 'intel' | 'amd' | 'gpu';
}

export default function PricingTable() {
  const { user } = useAuth();
  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  // Storage pricing info
  const storagePricing = {
    baseRate: 0.10, // $0.10/GB/month base rate
    rateWithMarkup: 0.1005 // $0.1005/GB/month final rate
  };

  const processorTypeInfo = {
    regular: {
      label: "Standard SSD",
      description: "Balanced performance for general workloads with reliable SSD storage",
      color: "default",
      bgColor: "bg-gray-600",
      textColor: "text-blue-400"
    },
    intel: {
      label: "Intel Optimized",
      description: "Enhanced performance for CPU-intensive tasks with Intel Xeon processors",
      color: "blue",
      bgColor: "bg-blue-600",
      textColor: "text-blue-400"
    },
    amd: {
      label: "AMD EPYC",
      description: "High performance and efficiency with AMD EPYC processors",
      color: "red",
      bgColor: "bg-red-600",
      textColor: "text-red-400"
    },
    gpu: {
      label: "GPU Accelerated",
      description: "NVIDIA GPU accelerated instances for AI, rendering and machine learning",
      color: "green",
      bgColor: "bg-green-600",
      textColor: "text-green-400"
    }
  };

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sizes.map((size) => {
          const processorType = size.processor_type || "regular";
          const processorInfo = processorTypeInfo[processorType];
          
          return (
            <Card key={size.slug} className="overflow-hidden border-2 hover:border-primary transition-all duration-200">
              {/* Processor type banner */}
              <div className={`${processorInfo.bgColor} text-white text-xs font-medium py-1 px-3 text-center`}>
                {processorInfo.label}
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {size.memory / 1024}GB
                  <span className="text-lg text-muted-foreground"> RAM</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">
                  ${Math.round(size.price_monthly * 1.005 * 100) / 100}
                  <span className="text-lg text-muted-foreground font-normal">
                    {" "}
                    /mo
                  </span>
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <Cpu className={`h-4 w-4 ${processorInfo.textColor}`} />
                  <span className="text-sm">{processorInfo.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{processorInfo.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    {size.vcpus} vCPUs
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    {size.disk}GB SSD Storage
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    {size.transfer}GB Transfer
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Global Availability
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href={user ? "/dashboard" : "/auth"}>
                    Get Started
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Additional pricing info section */}
      <div className="mt-12 mb-6">
        <h3 className="text-xl font-semibold mb-4">Additional Services</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Block Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                ${storagePricing.rateWithMarkup.toFixed(3)}
                <span className="text-lg text-muted-foreground font-normal"> /GB/mo</span>
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  SSD-backed block storage
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Expand storage without resizing servers
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Volumes can be moved between servers
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Sizes from 1GB to 10TB available
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Bandwidth Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                $0.010
                <span className="text-lg text-muted-foreground font-normal"> /GB overage</span>
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Free monthly transfer allowance with every server
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  1TB-5TB included depending on server size
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Pay only for what you use beyond included amount
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Bandwidth usage tracked monthly
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
