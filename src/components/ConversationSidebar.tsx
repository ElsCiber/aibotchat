import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, MoreVertical, Settings2, Pencil } from "lucide-react";
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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { CreditBalance } from "./CreditBalance";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  mode: string;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { state } = useSidebar();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    loadConversations();

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
      .subscribe();

    const handleRefresh = () => loadConversations();
    window.addEventListener('conversations:refresh', handleRefresh);

    return () => {
      window.removeEventListener('conversations:refresh', handleRefresh);
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

    loadConversations();

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
    loadConversations();

    toast({
      title: language === "es" ? "Modo cambiado" : "Mode changed",
      description: newMode === "developer" ? "Developer" : "Normal",
    });
  };

  const startRename = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const saveRename = async (id: string) => {
    if (!editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    const { error } = await supabase
      .from("conversations")
      .update({ title: editingTitle.trim() })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: language === "es" ? "Error al renombrar" : "Error renaming",
        variant: "destructive",
      });
      return;
    }

    setEditingId(null);
    loadConversations();

    toast({
      title: language === "es" ? "Renombrado" : "Renamed",
    });
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle("");
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

          <div className="h-2" />

          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <div className="relative group">
                    {editingId === conversation.id ? (
                      <div className="px-2 py-1">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(conversation.id);
                            if (e.key === "Escape") cancelRename();
                          }}
                          onBlur={() => saveRename(conversation.id)}
                          autoFocus
                          className="h-8 text-sm"
                        />
                      </div>
                    ) : (
                      <>
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
                                    {conversation.mode === "developer" ? "Developer" : "Normal"}
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
                            <DropdownMenuContent align="end" className="w-48 bg-background border-border z-50">
                              <DropdownMenuItem onClick={(e) => startRename(conversation, e)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                {language === "es" ? "Renombrar" : "Rename"}
                              </DropdownMenuItem>
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
                      </>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {!isCollapsed && (
        <SidebarFooter>
          <CreditBalance />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
