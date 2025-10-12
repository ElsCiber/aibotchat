import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        title: "Nueva conversación",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
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
    setCurrentConversationId(id);
  };

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
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
