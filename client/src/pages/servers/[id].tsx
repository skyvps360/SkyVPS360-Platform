import { useParams, Link } from "wouter";
import RegionDisplay from "@/components/region-display";

// ... other imports and components ...

function ServerDetailPage() {
  const { serverId } = useParams();
  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServer = async () => {
      try {
        const response = await fetch(`/api/servers/${serverId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setServer(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchServer();
  }, [serverId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
      <h1>{server.name}</h1>
      <p>
        <Memory>{server.specs?.memory}GB</Memory> <RegionDisplay regionSlug={server.region} />
      </p>
      {/* ... rest of the server details ... */}
    </div>
  );
}

export default ServerDetailPage;