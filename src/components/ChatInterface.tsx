import { useState, useRef, useEffect, useCallback, startTransition, useDeferredValue, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { streamChat, Message } from "@/utils/chatStream";
import ChatMessage from "./ChatMessage";
import { messageSchema, conversationTitleSchema } from "@/utils/validation";
import { Send, Globe, Image as ImageIcon, X, Menu, LogOut, Paperclip, Square } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ExportButton } from "@/components/ExportButton";
import { PdfPreview } from "@/components/PdfPreview";
import { VideoGenerationProgress } from "@/components/VideoGenerationProgress";

import { ModeSelector } from "@/components/ModeSelector";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { supabase } from "@/integrations/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

interface ChatInterfaceProps {
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  userId: string;
}

const ChatInterface = ({ conversationId, onConversationCreated, userId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, content: string, type: string}>>([]);
  const [mode, setMode] = useState<"formal" | "developer" | null>(null);
  const [isLoadingMode, setIsLoadingMode] = useState(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { toast } = useToast();
  
  // Autosave draft to localStorage
  const DRAFT_KEY = `chat_draft_${conversationId || 'new'}`;
  
  useEffect(() => {
    // Load draft on mount
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft && inputRef.current) {
      inputRef.current.value = savedDraft;
    }
  }, [DRAFT_KEY]);
  
  const saveDraft = useCallback(
    debounce((value: string) => {
      if (value.trim()) {
        localStorage.setItem(DRAFT_KEY, value);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, 500),
    [DRAFT_KEY]
  );
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    saveDraft(e.target.value);
  };
  const { language, setLanguage, t } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  
  // Refs for stable callbacks
  const messagesRef = useRef<Message[]>([]);
  const toastRef = useRef(toast);
  const onConversationCreatedRef = useRef(onConversationCreated);
  
  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);
  
  useEffect(() => {
    onConversationCreatedRef.current = onConversationCreated;
  }, [onConversationCreated]);
  
  const deferredMessages = useDeferredValue(messages);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      ctrlKey: true,
      action: () => {
        if (!conversationId) {
          // Already on a new conversation
          return;
        }
        onConversationCreated("");
      },
      description: language === "es" ? "Nueva conversación" : "New conversation",
    },
    {
      key: "b",
      ctrlKey: true,
      action: () => toggleSidebar(),
      description: language === "es" ? "Alternar sidebar" : "Toggle sidebar",
    },
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const debouncedScrollToBottom = useRef(debounce(scrollToBottom, 150)).current;

  useEffect(() => {
    debouncedScrollToBottom();
  }, [messages, debouncedScrollToBottom]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadConversationMode();
    } else {
      setMessages([]);
      setMode(null);
      setIsLoadingMode(false);
    }
  }, [conversationId]);

  const loadConversationMode = async () => {
    if (!conversationId) return;
    
    setIsLoadingMode(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("mode")
      .eq("id", conversationId)
      .single();

    if (!error && data) {
      setMode(data.mode as "formal" | "developer");
    }
    setIsLoadingMode(false);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Unable to load messages. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setMessages(
      data.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        images: msg.images || undefined,
        videos: msg.videos || undefined,
      }))
    );
  };

  const saveMessage = async (message: Message) => {
    if (!conversationId) return;

    const { error } = await supabase.from("messages").insert([{
      conversation_id: conversationId,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      images: message.images || null,
      videos: message.videos || null,
    }]);

    if (error) {
      // Silent fail - message saving errors are handled in handleSend
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
      // Silent fail - title update is non-critical
    }
  };

  const handleModeSelect = async (selectedMode: "formal" | "developer") => {
    setMode(selectedMode);
    
    // If we have a conversation ID, update it in the database
    if (conversationId) {
      const { error } = await supabase
        .from("conversations")
        .update({ mode: selectedMode })
        .eq("id", conversationId);
      
      if (error) {
        console.error("Error updating conversation mode:", error);
      }
    }
  };

  const handleSend = useCallback(async () => {
    const inputText = inputRef.current?.value.trim() ?? "";
    if ((!inputText && uploadedImages.length === 0 && uploadedFiles.length === 0) || isLoading) return;

    // Create conversation if none exists
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          title: "Nueva conversación",
          user_id: userId,
          mode: mode || "formal",
        })
        .select()
        .single();

      if (error) {
        toastRef.current({
          title: "Error",
          description: language === "es" ? "Error al crear la conversación" : "Error creating conversation",
          variant: "destructive",
        });
        return;
      }

      activeConversationId = data.id;
      onConversationCreatedRef.current(data.id);
    }

    let messageContent = inputText;
    
    // Add file contents to message if any
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles.map(file => 
        `\n\n[Archivo: ${file.name}]\n${file.content}`
      ).join('');
      messageContent = messageContent ? messageContent + fileContents : fileContents.substring(2);
    }
    
    // Default message for media without text
    if (!messageContent && uploadedImages.length === 0 && uploadedVideos.length === 0) {
      messageContent = language === "es" ? "¿Qué ves en esta imagen?" : "What do you see in this image?";
    }
    if (!messageContent && uploadedVideos.length > 0) {
      messageContent = language === "es" ? "¿Qué sucede en este vídeo?" : "What's happening in this video?";
    }
    
    const userMessage: Message = { 
      role: "user", 
      content: messageContent,
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      videos: uploadedVideos.length > 0 ? [...uploadedVideos] : undefined,
    };
    
    // Validate user message before saving
    try {
      messageSchema.parse({
        content: userMessage.content,
        role: userMessage.role,
        images: userMessage.images,
        videos: userMessage.videos,
      });
    } catch (error) {
      toastRef.current({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Invalid message format",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Show video analysis indicator if videos are attached
    if (uploadedVideos.length > 0) {
      toastRef.current({
        title: language === "es" ? "Analizando vídeo" : "Analyzing video",
        description: language === "es" ? "Gemini está procesando el vídeo..." : "Gemini is processing the video...",
      });
    }
    
    // Save message with the active conversation ID
    const { error: saveError } = await supabase.from("messages").insert([{
      conversation_id: activeConversationId,
      role: userMessage.role,
      content: typeof userMessage.content === 'string' ? userMessage.content : JSON.stringify(userMessage.content),
      images: userMessage.images || null,
      videos: userMessage.videos || null,
    }]);

    if (saveError) {
      toastRef.current({
        title: "Error",
        description: "Unable to save message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Update conversation title with first message
    if (messagesRef.current.length === 0) {
      let title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : "");
      
      // Validate title length
      try {
        title = conversationTitleSchema.parse(title);
      } catch {
        title = "Nueva conversación";
      }
      
      const { error: titleError } = await supabase
        .from("conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);

      if (titleError) {
        toastRef.current({
          title: "Error",
          description: "Unable to update conversation title.",
          variant: "destructive",
        });
      }
    }
    
    if (inputRef.current) inputRef.current.value = "";
    localStorage.removeItem(DRAFT_KEY); // Clear draft after sending
    setUploadedImages([]);
    setUploadedVideos([]);
    setUploadedFiles([]);
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    let assistantContent = "";
    let assistantImages: string[] = [];
    let assistantVideos: string[] = [];
    let scheduled = false;
    const flushAssistant = () => {
      startTransition(() => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            const next = prev.slice();
            next[next.length - 1] = { 
              ...last, 
              content: assistantContent, 
              images: assistantImages.length > 0 ? assistantImages : undefined,
              videos: assistantVideos.length > 0 ? assistantVideos : undefined,
            };
            return next;
          }
          return [
            ...prev,
            { role: "assistant", content: assistantContent, images: assistantImages.length > 0 ? assistantImages : undefined, videos: assistantVideos.length > 0 ? assistantVideos : undefined }
          ];
        });
      });
      scheduled = false;
    };
    const upsertAssistant = (chunk: string) => {
      // Check if chunk contains media data
      try {
        const parsed = JSON.parse(chunk);
        if (parsed.images) {
          assistantImages = parsed.images;
          setIsGeneratingVideo(false);
          // Force immediate flush when images are received
          flushAssistant();
          return;
        }
        if (parsed.videos) {
          assistantVideos = Array.isArray(parsed.videos) ? parsed.videos : [parsed.videos];
          setIsGeneratingVideo(false);
          setVideoProgress(100);
          // Force immediate flush when videos are received
          flushAssistant();
          return;
        }
        if (parsed.videoProgress !== undefined) {
          setVideoProgress(parsed.videoProgress);
          setIsGeneratingVideo(true);
          return;
        }
      } catch {
        // Not JSON, regular text content - sanitize placeholder tokens
        const sanitized = chunk.replace(/<\s*image\s*\/?\s*>|\[image\]|<\/?video[^>]*>|\[video\]/gi, "");
        assistantContent += sanitized;
        
        // Check if starting video generation
        if (sanitized.toLowerCase().includes("generando") && sanitized.toLowerCase().includes("vídeo")) {
          setIsGeneratingVideo(true);
          setVideoProgress(5);
        }
      }
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flushAssistant);
      }
    };

    await streamChat({
      messages: [...messagesRef.current, userMessage],
      mode,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: async () => {
        setIsLoading(false);
        setIsGeneratingVideo(false);
        setVideoProgress(0);
        abortControllerRef.current = null;
        // Save assistant message
          const assistantMessage: Message = {
            role: "assistant",
            content: assistantContent,
            images: assistantImages.length > 0 ? assistantImages : undefined,
            videos: assistantVideos.length > 0 ? assistantVideos : undefined,
          };
        
        if (activeConversationId) {
          // Validate assistant message
          try {
            messageSchema.parse({
              content: assistantMessage.content,
              role: assistantMessage.role,
              images: assistantMessage.images,
              videos: assistantMessage.videos,
            });
            
            await supabase.from("messages").insert([{
              conversation_id: activeConversationId,
              role: assistantMessage.role,
              content: typeof assistantMessage.content === 'string' ? assistantMessage.content : JSON.stringify(assistantMessage.content),
              images: assistantMessage.images || null,
              videos: assistantMessage.videos || null,
            }]);
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        }

        // Update conversation's updated_at timestamp
        if (activeConversationId) {
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", activeConversationId);
        }
        
        // Trigger conversation list refresh
        window.dispatchEvent(new CustomEvent('conversations:refresh'));
      },
      onError: (error) => {
        setIsLoading(false);
        abortControllerRef.current = null;
        toastRef.current({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      },
      signal: abortControllerRef.current?.signal,
    });
  }, [uploadedImages, uploadedFiles, isLoading, conversationId, userId, mode, language]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Error",
          description: language === "es" ? "El archivo es demasiado grande (max 20MB)" : "File too large (max 20MB)",
          variant: "destructive",
        });
        continue;
      }

      // Handle images (jpg, png, webp, gif, etc.)
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUploadedImages((prev) => [...prev, base64]);
          toast({
            title: language === "es" ? "Imagen adjuntada" : "Image attached",
            description: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
      else if (file.type.startsWith("video/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setUploadedVideos((prev) => [...prev, base64]);
          toast({
            title: language === "es" ? "Vídeo adjuntado" : "Video attached",
            description: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
      // Handle PDF files
      else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setUploadedFiles((prev) => [...prev, {
            name: file.name,
            content: content,
            type: file.type || "application/pdf"
          }]);
          toast({
            title: language === "es" ? "PDF cargado" : "PDF loaded",
            description: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
      // Handle text files
      else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setUploadedFiles((prev) => [...prev, {
            name: file.name,
            content: content,
            type: file.type
          }]);
          toast({
            title: language === "es" ? "Archivo cargado" : "File loaded",
            description: file.name,
          });
        };
        reader.readAsText(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachImage = (imageUrl: string) => {
    setUploadedImages((prev) => [...prev, imageUrl]);
    toast({
      title: language === "es" ? "Imagen adjuntada" : "Image attached",
      description: language === "es" ? "La imagen se ha añadido a tu mensaje" : "The image has been added to your message",
    });
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-card">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-2">
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
                <Logo className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {t("title")}
                  </h1>
                  <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
              <ExportButton conversationId={conversationId} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    🇬🇧 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("es")}>
                    🇪🇸 Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <SettingsDialog />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {!mode && !isLoadingMode ? (
            <ModeSelector onModeSelect={handleModeSelect} />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <Logo className="w-32 h-32 opacity-70" />
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">{t("welcome")}</h2>
                <p className="text-lg text-muted-foreground max-w-md">
                  {language === "es" 
                    ? "Pregunta lo que quieras. Puedo ayudarte con información, análisis y mucho más." 
                    : "Ask me anything. I can help you with information, analysis, and much more."}
                </p>
                {mode && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {mode === "formal" ? "💼" : "⚙️"} 
                    {mode === "formal" 
                      ? (language === "es" ? "Modo Normal" : "Normal Mode")
                      : (language === "es" ? "Modo Developer" : "Developer Mode")}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                <div className="px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  💡 {language === "es" ? "Adjunta imágenes y documentos" : "Attach images and documents"}
                </div>
                <div className="px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  🎨 {language === "es" ? "Cambia el tema de color" : "Change color theme"}
                </div>
                <div className="px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  📁 {language === "es" ? "Organiza en carpetas" : "Organize in folders"}
                </div>
              </div>
            </div>
          ) : (
            <>
              {deferredMessages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  message={message} 
                  language={language}
                  onAttachImage={handleAttachImage}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === "assistant"}
                />
              ))}
              {isGeneratingVideo && (
                <div className="flex gap-3 items-start mb-6">
                  <div className="flex-1">
                    <VideoGenerationProgress 
                      progress={videoProgress} 
                      estimatedTime={videoProgress < 30 ? "~5-6 min" : videoProgress < 60 ? "~3-4 min" : videoProgress < 90 ? "~1-2 min" : "~30 seg"}
                    />
                  </div>
                </div>
              )}
              {isLoading && !isGeneratingVideo && (
                <div className="flex gap-3 items-start mb-6">
                  <div className="bg-card border border-border rounded-2xl px-6 py-4 shadow-lg">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {(uploadedImages.length > 0 || uploadedVideos.length > 0 || uploadedFiles.length > 0) && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {uploadedImages.map((img, idx) => (
                <div key={`img-${idx}`} className="relative">
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

              {uploadedVideos.map((vid, idx) => (
                <div key={`vid-${idx}`} className="relative">
                  <video
                    src={vid}
                    className="h-20 w-20 object-cover rounded-lg border border-border"
                    controls
                  />
                  <button
                    onClick={() => setUploadedVideos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {uploadedFiles.map((file, idx) => (
                <PdfPreview
                  key={`file-${idx}`}
                  file={file}
                  onRemove={() => removeFile(idx)}
                />
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md,.json,.csv"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title={language === "es" ? "Adjuntar archivos (imágenes, vídeos, PDFs, documentos)" : "Attach files (images, videos, PDFs, documents)"}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              ref={inputRef}
              defaultValue=""
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder={t("placeholder")}
              className="flex-1 bg-background border-border focus-visible:ring-primary"
            />
            {isLoading ? (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="shrink-0"
              >
                <Square className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!mode}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                <Send className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
