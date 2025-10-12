import { Message } from "@/utils/chatStream";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Copy, Check, Download } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
  language?: string;
}

const ChatMessage = ({ message, language = "en" }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const handlePlayAudio = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: message.content, language }
      });

      if (error) {
        console.error('Text-to-speech error:', error);
        throw new Error(error.message || 'Failed to generate audio');
      }

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Error",
            description: language === "es" ? "Error al reproducir audio" : "Failed to play audio",
            variant: "destructive",
          });
        };

        await audio.play();
      } else {
        throw new Error('No audio content received');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: "Error",
        description: language === "es" ? "Error al generar audio" : "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      toast({
        title: language === "es" ? "Copiado" : "Copied",
        description: language === "es" ? "Respuesta copiada al portapapeles" : "Response copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: language === "es" ? "No se pudo copiar" : "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deepview-image-${Date.now()}-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: language === "es" ? "Descargado" : "Downloaded",
        description: language === "es" ? "Imagen descargada correctamente" : "Image downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: language === "es" ? "No se pudo descargar la imagen" : "Failed to download image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 shadow-lg",
          isUser
            ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
            : "bg-card border border-border"
        )}
        style={isUser ? { boxShadow: "var(--shadow-glow)" } : {}}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.images && message.images.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {message.images.map((img, idx) => (
              <div key={idx} className="relative inline-block">
                <img
                  src={img}
                  alt={`Generated image ${idx + 1}`}
                  className="max-w-full rounded-lg border border-border"
                  style={{ maxHeight: "400px" }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadImage(img, idx)}
                  className="absolute bottom-2 right-2 shadow-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {language === "es" ? "Descargar" : "Download"}
                </Button>
              </div>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayAudio}
              disabled={isLoading}
              className="h-8 px-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className={cn("h-4 w-4", isPlaying && "text-primary")} />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
