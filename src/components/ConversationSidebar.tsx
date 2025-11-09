import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const { state } = useSidebar();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {!isCollapsed && (
            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === "es" ? "Buscar conversaciones..." : "Search conversations..."}
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
                  <SidebarMenuButton
                    onClick={() => onConversationChange(conversation.id)}
                    isActive={currentConversationId === conversation.id}
                    className="group relative"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 flex flex-col items-start min-w-0">
                          <span className="text-sm truncate w-full">
                            {conversation.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conversation.updated_at)}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => deleteConversation(conversation.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
