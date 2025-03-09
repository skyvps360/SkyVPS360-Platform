import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "react-simple-wysiwyg";
import {
  ChevronDown,
  ChevronRight,
  Book,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Server,
  Shield,
  HardDrive,
  Terminal,
  Cpu,
  Wifi,
  Save,
  MoveVertical
} from "lucide-react";

// Documentation section types
interface DocArticle {
  id: number;
  sectionId: number;
  title: string;
  content: string;
  order: number;
  lastUpdated: string;
}

interface DocSection {
  id: number;
  title: string;
  order: number;
  children: DocArticle[];
}

// Documentation article viewer component
const ArticleViewer = ({ article }: { article: DocArticle | null }) => {
  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select an article to view</p>
      </div>
    );
  }

  // Process HTML content for display
  const formatContent = (content: string) => {
    // Check if content is already HTML (starts with HTML tags)
    // If not, convert from markdown format for backward compatibility
    if (!content.trim().startsWith('<')) {
      // Convert legacy markdown to HTML
      let formattedContent = content
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-4 mb-2 text-foreground">$1</h3>')
        // Parse code blocks
        .replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-md my-4 overflow-x-auto text-sm font-mono text-foreground">$1</pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">$1</code>')
        // Parse lists
        .replace(/^\s*[\-\*]\s(.*)$/gm, '<li class="ml-4 mb-1 text-foreground">$1</li>')
        // Parse paragraphs
        .replace(/^(?!<[hl\d]|<pre|<li)(.*$)/gm, (match) => {
          if (match.trim() === '') return '<br>';
          return `<p class="mb-3 text-foreground">${match}</p>`;
        });

      return { __html: formattedContent };
    }

    // Content is already HTML, return as is
    return { __html: content };
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground">
      <div className="mb-4 pb-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {new Date(article.lastUpdated).toLocaleDateString()}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 self-start sm:self-auto"
          onClick={() => {
            // Open print dialog
            window.print();
          }}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>
      <div dangerouslySetInnerHTML={formatContent(article.content)} className="overflow-x-auto" />
    </div>
  );
};

// Documentation sidebar component
const DocSidebar = ({
  sections,
  activeArticleId,
  setActiveArticleId
}: {
  sections: DocSection[],
  activeArticleId: number | null,
  setActiveArticleId: (id: number) => void
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with all sections expanded
  useEffect(() => {
    const expanded: Record<number, boolean> = {};
    sections.forEach(section => {
      expanded[section.id] = true;
    });
    setExpandedSections(expanded);
  }, [sections]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter sections/articles based on search query
  const filteredSections = searchQuery.trim() === ''
    ? sections
    : sections.map(section => {
      const filteredChildren = section.children.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...section, children: filteredChildren };
    }).filter(section => section.children.length > 0);

  return (
    <div className="w-full">
      <div className="mb-4 relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1">
        {filteredSections.map((section: DocSection) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors text-foreground"
            >
              <span>{section.title}</span>
              {expandedSections[section.id] ?
                <ChevronDown className="h-4 w-4 text-muted-foreground" /> :
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              }
            </button>

            {expandedSections[section.id] && (
              <div className="mt-1 ml-2 space-y-1 border-l-2 border-muted">
                {section.children.map(article => (
                  <button
                    key={article.id}
                    onClick={() => setActiveArticleId(article.id)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors ${
                      activeArticleId === article.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Documentation Page Component
export default function DocsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("documentation");
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);

  // State for editing
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [editArticleDialogOpen, setEditArticleDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<DocSection | null>(null);
  const [currentArticle, setCurrentArticle] = useState<DocArticle | null>(null);
  const [isNewSection, setIsNewSection] = useState(false);
  const [isNewArticle, setIsNewArticle] = useState(false);
  const [articleOrder, setArticleOrder] = useState<number>(0);

  // Form state
  const [sectionTitle, setSectionTitle] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleSectionId, setArticleSectionId] = useState<number | null>(null);

  // Effect to handle opening dialog after tab switch
  useEffect(() => {
    if (activeTab === "editor" && pendingDialogOpen) {
      setEditArticleDialogOpen(true);
      setPendingDialogOpen(false);
    }
  }, [activeTab, pendingDialogOpen]);

  // React Query client for cache management
  const queryClient = useQueryClient();

  // Fetch documentation data
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['documentation'],
    queryFn: async () => {
      const response = await fetch('/api/docs/sections');
      if (!response.ok) throw new Error('Failed to fetch documentation');
      return response.json();
    }
  });

  // Get the active article from the sections data
  const activeArticle = activeArticleId
    ? sections
        .flatMap((section: DocSection) => section.children)
        .find((article: DocArticle) => article.id === activeArticleId) || null
    : null;

  // Set first article as active if not set and sections are loaded
  useEffect(() => {
    if (sections.length > 0 && !activeArticleId && sections[0].children.length > 0) {
      setActiveArticleId(sections[0].children[0].id);
    }
  }, [sections, activeArticleId]);

  // Check for admin access to show the editor tab
  const isAdmin = user?.isAdmin;

  // Mutations for CRUD operations
  const createSection = useMutation({
    mutationFn: async (data: { title: string, order: number }) => {
      const response = await fetch('/api/docs/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create section');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Section Created", description: "Your section has been created successfully." });
    },
    onError: (error) => {
      toast({
        title: "Section Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateSection = useMutation({
    mutationFn: async (data: { id: number, title: string }) => {
      const response = await fetch(`/api/docs/sections/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.title })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update section');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Section Updated", description: "Your section has been updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Section Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteSection = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/docs/sections/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete section');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      setActiveArticleId(null);
      toast({ title: "Section Deleted", description: "The section and all its articles have been deleted." });
    },
    onError: (error) => {
      toast({
        title: "Section Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createArticle = useMutation({
    mutationFn: async (data: { sectionId: number, title: string, content: string, order: number }) => {
      const response = await fetch('/api/docs/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create article');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      setActiveArticleId(data.id);
      toast({ title: "Article Created", description: "Your article has been created successfully." });
    },
    onError: (error) => {
      toast({
        title: "Article Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateArticle = useMutation({
    mutationFn: async (data: { id: number, sectionId?: number, title: string, content: string }) => {
      const response = await fetch(`/api/docs/articles/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          ...(data.sectionId ? { sectionId: data.sectionId } : {})
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update article');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Article Updated", description: "Your article has been updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Article Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/docs/articles/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete article');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      setActiveArticleId(null);
      toast({ title: "Article Deleted", description: "The article has been deleted successfully." });
    },
    onError: (error) => {
      toast({
        title: "Article Deletion Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add reorderSection mutation
  const reorderSection = useMutation({
    mutationFn: async (data: { id: number, order: number }) => {
      const response = await fetch(`/api/docs/sections/${data.id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: data.order })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder section');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Section Reordered", description: "The section order has been updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Section Reorder Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Add reorderArticle mutation
  const reorderArticle = useMutation({
    mutationFn: async (data: { id: number, order: number }) => {
      const response = await fetch(`/api/docs/articles/${data.id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: data.order })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder article');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Article Reordered", description: "The article order has been updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Article Reorder Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handler for saving a section
  const handleSaveSection = () => {
    if (!sectionTitle.trim()) return;

    if (isNewSection) {
      // Create a new section
      createSection.mutate({
        title: sectionTitle,
        order: sections.length + 1
      });
    } else if (currentSection) {
      // Update existing section
      updateSection.mutate({
        id: currentSection.id,
        title: sectionTitle
      });
    }

    setEditSectionDialogOpen(false);
  };

  // Handler for saving an article
  const handleSaveArticle = () => {
    if (!articleTitle.trim() || !articleContent.trim() || !articleSectionId) return;

    if (isNewArticle) {
      // Create a new article with the specified order
      createArticle.mutate({
        sectionId: articleSectionId,
        title: articleTitle,
        content: articleContent,
        order: articleOrder || getNextAvailableOrder(sections.find((s: DocSection) => s.id === articleSectionId)?.children || [])
      });
    } else if (currentArticle) {
      // Update existing article
      const updateData: any = {
        id: currentArticle.id,
        title: articleTitle,
        content: articleContent
      };

      if (articleSectionId !== currentArticle.sectionId) {
        updateData.sectionId = articleSectionId;
      }

      updateArticle.mutate(updateData);
    }

    setEditArticleDialogOpen(false);
  };

  // Handler for deleting a section
  const handleDeleteSection = (sectionId: number) => {
    if (confirm("Are you sure you want to delete this section? All articles in this section will also be deleted.")) {
      deleteSection.mutate(sectionId);
    }
  };

  // Handler for deleting an article
  const handleDeleteArticle = (articleId: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle.mutate(articleId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading documentation...</p>
        </div>
      </div>
    );
  }

  const getNextAvailableOrder = (items: Array<{ id: number; order: number }>, currentItemId?: number): number => {
    const orders = items
      .filter(item => item.id !== currentItemId)
      .map(item => item.order)
      .sort((a, b) => a - b);

    let nextOrder = 1;
    for (const order of orders) {
      if (order > nextOrder) break;
      nextOrder = order + 1;
    }
    return nextOrder;
  };


  // Update the button onClick handler
  const handleAddArticleAtPosition = (section: DocSection) => {
    const nextOrder = getNextAvailableOrder(section.children);
    setIsNewArticle(true);
    setCurrentArticle(null);
    setArticleTitle("");
    setArticleContent("");
    setArticleSectionId(section.id);
    setArticleOrder(nextOrder);
    setActiveTab("editor");
    setPendingDialogOpen(true);
  };

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center text-foreground">
          <Book className="mr-2 h-8 w-8" />
          Documentation
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="documentation">
            <FileText className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="editor">
                <Edit className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="reorder">
                <MoveVertical className="h-4 w-4 mr-2" />
                Reorder
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="documentation" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Documentation Sidebar */}
            <div className="md:col-span-3">
              <Card>
                <CardContent className="p-4">
                  <DocSidebar
                    sections={sections}
                    activeArticleId={activeArticleId}
                    setActiveArticleId={setActiveArticleId}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Documentation Content */}
            <div className="md:col-span-9">
              <Card>
                <CardContent className="p-6">
                  <ArticleViewer article={activeArticle} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Admin Documentation Editor */}
        {isAdmin && (
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Editor</CardTitle>
                <CardDescription>
                  Manage documentation sections and articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sections">
                  <TabsList className="mb-4">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="articles">Articles</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sections">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Documentation Sections</h3>
                        <Button onClick={() => {
                          setIsNewSection(true);
                          setCurrentSection(null);
                          setSectionTitle("");
                          setEditSectionDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                      </div>

                      <div className="border rounded-md divide-y">
                        {sections.map((section: DocSection) => (
                          <div key={section.id} className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {section.children.length} articles
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsNewSection(false);
                                  setCurrentSection(section);
                                  setSectionTitle(section.title);
                                  setEditSectionDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="articles">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Documentation Articles</h3>
                        <Button
                          onClick={() => {
                            setIsNewArticle(true);
                            setCurrentArticle(null);
                            setArticleTitle("");
                            setArticleContent("");
                            setArticleSectionId(sections[0]?.id || null);
                            setArticleOrder(0); // Reset order for normal article creation
                            setEditArticleDialogOpen(true);
                          }}
                          disabled={sections.length === 0}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Article
                        </Button>
                      </div>

                      <div className="border rounded-md divide-y">
                        {sections.flatMap((section: DocSection) =>
                          section.children.map((article: DocArticle) => (
                            <div key={article.id} className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{article.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Section: {section.title} | Last updated: {new Date(article.lastUpdated).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsNewArticle(false);
                                    setCurrentArticle(article);
                                    setArticleTitle(article.title);
                                    setArticleContent(article.content);
                                    setArticleSectionId(article.sectionId);
                                    setArticleOrder(article.order); // Set current order for editing
                                    setEditArticleDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Section Edit Dialog */}
            <Dialog open={editSectionDialogOpen} onOpenChange={setEditSectionDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isNewSection ? "Add Section" : "Edit Section"}</DialogTitle>
                  <DialogDescription>
                    {isNewSection ? "Create a new documentation section" : "Update section details"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input
                      id="section-title"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="e.g., Getting Started"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditSectionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSaveSection}
                    disabled={!sectionTitle.trim() || createSection.isPending || updateSection.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isNewSection ? "Create Section" : "Update Section"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Article Edit Dialog */}
            <Dialog open={editArticleDialogOpen} onOpenChange={setEditArticleDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{isNewArticle ? "Add Article" : "Edit Article"}</DialogTitle>
                  <DialogDescription>
                    {isNewArticle ? "Create a new documentation article" : "Update article content"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="article-section">Section</Label>
                    <select
                      id="article-section"
                      value={articleSectionId || ""}
                      onChange={(e) => setArticleSectionId(parseInt(e.target.value))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="" disabled>Select a section</option>
                      {sections.map((section: DocSection) => (
                        <option key={section.id} value={section.id}>
                          {section.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-title">Article Title</Label>
                    <Input
                      id="article-title"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="e.g., Getting Started with CloudHost"
                    />
                  </div>
                  {isNewArticle && (
                    <div className="space-y-2">
                      <Label htmlFor="article-order">Position</Label>
                      <Input
                        id="article-order"
                        type="number"
                        min="1"
                        value={articleOrder}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setArticleOrder(value);
                          }
                        }}
                        className="w-24"
                      />
                      <p className="text-sm text-muted-foreground">
                        Position in the section's article list. Lower numbers appear first.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="article-content">Content (HTML Editor)</Label>
                    <div className="border rounded-md">
                      <RichTextEditor
                        id="article-content"
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        className="min-h-[400px] w-full bg-background p-4"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditArticleDialogOpen(false);
                      // Reset the order when closing
                      if (isNewArticle) {
                        setArticleOrder(0);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSaveArticle}
                    disabled={!articleTitle.trim() || !articleContent.trim() || !articleSectionId || createArticle.isPending || updateArticle.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isNewArticle ? "Create Article" : "Update Article"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="reorder">
            <Card>
              <CardHeader>
                <CardTitle>Reorder Documentation</CardTitle>
                <CardDescription>
                  Adjust the order of sections and articles. Each number must be unique within its group.
                  Lower numbers appear first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4 text-foreground">Sections</h3>
                    <div className="space-y-4">
                      {sections.map((section: DocSection) => (
                        <div key={section.id} className="flex items-center gap-4 p-4 border border-muted rounded-lg">
                          <Input
                            type="number"
                            min="1"
                            className="w-24"
                            value={section.order}
                            onChange={(e) => {
                              const newOrder = parseInt(e.target.value);
                              if (!isNaN(newOrder) && newOrder > 0) {
                                reorderSection.mutate({ id: section.id, order: newOrder });
                              }
                            }}
                          />
                          <span className="flex-grow font-medium text-foreground">{section.title}</span>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Position: {section.order}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-medium mb-4 text-foreground">Articles by Section</h3>
                    <div className="space-y-6">
                      {sections.map((section: DocSection) => (
                        <div key={section.id} className="space-y-3 border border-muted rounded-lg p-4">
                          <h4 className="font-medium text-lg text-foreground">
                            {section.title} <span className="text-muted-foreground">(Section {section.order})</span>
                          </h4>
                          <div className="space-y-2">
                            {section.children.map((article: DocArticle) => (
                              <div key={article.id} className="flex items-center gap-4 p-4 border border-muted rounded-lg bg-card">
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-24"
                                  value={article.order}
                                  onChange={(e) => {
                                    const newOrder = parseInt(e.target.value);
                                    if (!isNaN(newOrder) && newOrder > 0) {
                                      reorderArticle.mutate({ id: article.id, order: newOrder });
                                    }
                                  }}
                                />
                                <span className="flex-grow text-foreground">{article.title}</span>
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  Position: {article.order}
                                </span>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => handleAddArticleAtPosition(section)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Article at Position {getNextAvailableOrder(section.children)}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-foreground">Quick Tips:</h4>
                    <ul className="list-disc ml-4 space-y-1 text-sm text-muted-foreground">
                      <li>Each section must have a unique order number</li>
                      <li>Articles within each section must have unique order numbers</li>
                      <li>The system will automatically adjust other items' order if needed</li>
                      <li>Lower numbers appear first in the documentation</li>
                    </ul>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}