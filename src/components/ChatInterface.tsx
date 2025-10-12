import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { streamChat, Message } from "@/utils/chatStream";
import ChatMessage from "./ChatMessage";
import { Send, Globe, Image as ImageIcon, X, Menu, LogOut } from "lucide-react";
import deepViewLogo from "@/assets/deepview-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  userId: string;
}

const ChatInterface = ({ conversationId, onConversationCreated, userId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(
      data.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        images: msg.images || undefined,
      }))
    );
  };

  const saveMessage = async (message: Message) => {
    if (!conversationId) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      images: message.images || null,
    });

    if (error) {
      console.error("Error saving message:", error);
    }
  };

  const updateConversationTitle = async (firstMessage: string) => {
    if (!conversationId) return;

    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    
    const { error } = await supabase
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;

    // Create conversation if none exists
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          title: "Nueva conversación",
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: language === "es" ? "Error al crear la conversación" : "Error creating conversation",
          variant: "destructive",
        });
        return;
      }

      activeConversationId = data.id;
      onConversationCreated(data.id);
    }

    const userMessage: Message = { 
      role: "user", 
      content: input.trim() || (language === "es" ? "¿Qué ves en esta imagen?" : "What do you see in this image?"),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined
    };
    
    // Detect image generation request
    const inputLower = input.toLowerCase();
    const isImageGenRequest = (
      (inputLower.includes("genera") || inputLower.includes("crea") || inputLower.includes("dibuja") ||
       inputLower.includes("generate") || inputLower.includes("create") || inputLower.includes("draw")) &&
      (inputLower.includes("imagen") || inputLower.includes("image") || inputLower.includes("foto") || inputLower.includes("picture"))
    );
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Save message with the active conversation ID
    const { error: saveError } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      role: userMessage.role,
      content: userMessage.content,
      images: userMessage.images || null,
    });

    if (saveError) {
      console.error("Error saving message:", saveError);
    }
    
    // Update conversation title with first message
    if (messages.length === 0) {
      const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : "");
      
      const { error: titleError } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);

      if (titleError) {
        console.error("Error updating conversation title:", titleError);
      }
    }
    
    setInput("");
    setUploadedImages([]);
    setIsLoading(true);

    // Add "Generating image..." message if it's an image generation request
    if (isImageGenRequest) {
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: language === "es" ? "Generando imagen..." : "Generating image..." 
      }]);
    }

    let assistantContent = "";
    let assistantImages: string[] = [];
    const upsertAssistant = (chunk: string) => {
      // Check if chunk contains image data
      try {
        const parsed = JSON.parse(chunk);
        if (parsed.images) {
          assistantImages = parsed.images;
          return;
        }
      } catch {
        // Not JSON, regular text content
        assistantContent += chunk;
      }
      
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 
              ? { ...m, content: assistantContent, images: assistantImages.length > 0 ? assistantImages : undefined } 
              : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent, images: assistantImages.length > 0 ? assistantImages : undefined }];
      });
    };

    await streamChat({
      messages: [...messages, userMessage],
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: async () => {
        setIsLoading(false);
        // Save assistant message
        const assistantMessage: Message = {
          role: "assistant",
          content: assistantContent,
          images: assistantImages.length > 0 ? assistantImages : undefined,
        };
        
        if (activeConversationId) {
          const { error } = await supabase.from("messages").insert({
            conversation_id: activeConversationId,
            role: assistantMessage.role,
            content: assistantMessage.content,
            images: assistantMessage.images || null,
          });

          if (error) {
            console.error("Error saving message:", error);
          }
        }
      },
      onError: (error) => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Error",
          description: language === "es" ? "La imagen es demasiado grande (max 20MB)" : "Image too large (max 20MB)",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-card">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="relative">
                <img src={deepViewLogo} alt="DeepView Logo" className="w-12 h-12 rounded-full" />
                <div className="absolute inset-0 blur-xl bg-primary/50 animate-pulse rounded-full" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {t("title")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    🇬🇧 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("es")}>
                    🇪🇸 Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <img src={deepViewLogo} alt="DeepView Logo" className="w-24 h-24 opacity-50 rounded-full" />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t("welcome")}</h2>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} language={language} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Upload ${idx + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("placeholder")}
              disabled={isLoading}
              className="flex-1 bg-background border-border focus-visible:ring-primary"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
