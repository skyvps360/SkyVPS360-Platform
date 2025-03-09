import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import PricingTable from "@/components/pricing-table";
import LocationMap from "@/components/location-map";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Server, 
  Globe, 
  Shield, 
  Cpu, 
  BarChart3, 
  Gamepad2,
  Bot,
  Code,
  Store,
  Database
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SkyVPS360</h1>
          <div className="space-x-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">High-Performance VPS Hosting</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Deploy your applications on powerful virtual servers with worldwide locations.
            Powered by SkyVPS360 infrastructure.
          </p>
          <Button size="lg" asChild>
            <Link href={user ? "/dashboard" : "/auth"}>Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Versatile Solutions for Any Application</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            From development environments to production workloads, our hosting platform powers everything you need
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Game Servers */}
            <Card className="border-2 hover:border-primary transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Gamepad2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Game Servers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Host Minecraft, CS:GO, ARK and more with low latency and high uptime for the best player experience
                  </p>
                  <Button variant="outline" size="sm" className="mt-auto" asChild>
                    <Link href={user ? "/dashboard" : "/auth"}>Deploy Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Discord Bots */}
            <Card className="border-2 hover:border-primary transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Discord Bots</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run Discord bots 24/7 with reliable uptime and the resources they need to scale with your community
                  </p>
                  <Button variant="outline" size="sm" className="mt-auto" asChild>
                    <Link href={user ? "/dashboard" : "/auth"}>Deploy Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Web Applications */}
            <Card className="border-2 hover:border-primary transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Code className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Web Applications</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Host Node.js, Python, PHP and more with our optimized application stacks for maximum performance
                  </p>
                  <Button variant="outline" size="sm" className="mt-auto" asChild>
                    <Link href={user ? "/dashboard" : "/auth"}>Deploy Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Databases */}
            <Card className="border-2 hover:border-primary transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Databases</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dedicated database servers with MongoDB, PostgreSQL, MySQL and Redis for your data needs
                  </p>
                  <Button variant="outline" size="sm" className="mt-auto" asChild>
                    <Link href={user ? "/dashboard" : "/auth"}>Deploy Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Location Map */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Global Infrastructure</h2>
          <LocationMap />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Enterprise-Grade Features</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Our platform comes with everything you need to run your applications with confidence
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">High-Performance Hardware</h3>
                <p className="text-sm text-muted-foreground">
                  Latest generation Intel and AMD processors with NVMe SSD storage for lightning-fast performance.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Global Network</h3>
                <p className="text-sm text-muted-foreground">
                  Multiple data centers around the world with low-latency connections and high-speed bandwidth.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Advanced Security</h3>
                <p className="text-sm text-muted-foreground">
                  Built-in DDoS protection, firewall rules, and SSH key authentication to keep your servers secure.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Resource Scaling</h3>
                <p className="text-sm text-muted-foreground">
                  Easily scale your server resources as your needs grow, with no downtime or service interruptions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive monitoring tools to track CPU, memory, disk, and network usage in real-time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-full bg-primary/10 mt-1">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Application Marketplace</h3>
                <p className="text-sm text-muted-foreground">
                  One-click deployment for popular applications, game servers, and development stacks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Choose from a variety of server configurations tailored to your specific needs
          </p>
          <PricingTable />
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Deploy your first server in minutes and experience the power of CloudRack hosting.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href={user ? "/dashboard" : "/auth"}>Create Server Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
