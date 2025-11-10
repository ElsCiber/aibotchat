import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const createNewConversation = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        title: "Nueva conversación",
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      // Silent fail - will be handled by ChatInterface
      return;
    }

    setCurrentConversationId(data.id);
  };

  const handleConversationChange = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
  };

  const handleConversationCreated = (id: string) => {
    // If empty string, create new conversation
    if (id === "") {
      setCurrentConversationId(null);
    } else {
      setCurrentConversationId(id);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onConversationChange={handleConversationChange}
          onNewConversation={handleNewConversation}
        />
        <main className="flex-1">
          <ChatInterface 
            conversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
            userId={user.id}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
