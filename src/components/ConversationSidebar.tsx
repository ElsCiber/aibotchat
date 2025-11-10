import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, Search, Folder, MoreVertical, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  mode: string;
}

interface FolderType {
  id: string;
  name: string;
  color: string;
}

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onConversationChange: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationSidebar({
  currentConversationId,
  onConversationChange,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);
  const { state } = useSidebar();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "k",
      ctrlKey: true,
      action: () => {
        searchInputRef?.focus();
        searchInputRef?.select();
      },
      description: language === "es" ? "Buscar conversaciones" : "Search conversations",
    },
  ]);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === null || selectedFolder === "all" || conv.folder_id === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  useEffect(() => {
    loadConversations();
    loadFolders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "folders",
        },
        () => {
          loadFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      // Silent fail - conversations will be empty
      return;
    }

    setConversations(data || []);
  };

  const loadFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading folders:", error);
      return;
    }

    setFolders(data || []);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al eliminar la conversación" : "Error deleting conversation",
        variant: "destructive",
      });
      return;
    }

    if (currentConversationId === id) {
      onNewConversation();
    }

    toast({
      title: language === "es" ? "Conversación eliminada" : "Conversation deleted",
    });
  };

  const changeModeConversation = async (id: string, newMode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from("conversations")
      .update({ mode: newMode })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al cambiar el modo" : "Error changing mode",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: language === "es" ? "Modo cambiado" : "Mode changed",
      description: newMode === "developer" ? "Developer" : "Normal",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return language === "es" ? "Hoy" : "Today";
    } else if (diffInHours < 48) {
      return language === "es" ? "Ayer" : "Yesterday";
    } else {
      return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">
              {language === "es" ? "Conversaciones" : "Conversations"}
            </h2>
          )}
          <SidebarTrigger />
        </div>
        {!isCollapsed && folders.length > 0 && (
          <div className="mt-3">
            <Select value={selectedFolder || "all"} onValueChange={(value) => setSelectedFolder(value === "all" ? null : value)}>
              <SelectTrigger className="bg-background">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    {selectedFolder 
                      ? folders.find(f => f.id === selectedFolder)?.name 
                      : (language === "es" ? "Todas" : "All")}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="all">
                  {language === "es" ? "Todas las carpetas" : "All folders"}
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" style={{ color: folder.color }} />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">
            <Button
              onClick={onNewConversation}
              className="w-full justify-start gap-2"
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {!isCollapsed && (language === "es" ? "Nueva conversación" : "New conversation")}
            </Button>
          </SidebarGroupLabel>

          {!isCollapsed && (
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={setSearchInputRef}
                  placeholder={language === "es" ? "Buscar... (Ctrl+K)" : "Search... (Ctrl+K)"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          )}

          <div className="h-2" />

          <SidebarGroupContent>
            <SidebarMenu>
              {filteredConversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <div className="relative group">
                    <SidebarMenuButton
                      onClick={() => onConversationChange(conversation.id)}
                      isActive={currentConversationId === conversation.id}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 flex flex-col items-start min-w-0">
                            <span className="text-sm truncate w-full">
                              {conversation.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {conversation.mode === "developer" ? "⚙️ Developer" : "💼 Normal"}
                              </span>
                              <span>•</span>
                              <span>{formatDate(conversation.updated_at)}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </SidebarMenuButton>
                    {!isCollapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => changeModeConversation(
                              conversation.id,
                              conversation.mode === "developer" ? "formal" : "developer",
                              e
                            )}
                          >
                            <Settings2 className="h-4 w-4 mr-2" />
                            {language === "es" ? "Cambiar a " : "Change to "}
                            {conversation.mode === "developer" ? "Normal" : "Developer"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => deleteConversation(conversation.id, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {language === "es" ? "Eliminar" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
