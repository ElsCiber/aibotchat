import { Message } from "@/utils/chatStream";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        body: { text: message.content }
      });

      if (error) throw error;

      if (data.audioContent) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Error",
            description: "Failed to play audio",
            variant: "destructive",
          });
        };

        await audio.play();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: "Error",
        description: "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        {!isUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayAudio}
            disabled={isLoading}
            className="mt-2 h-8 px-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className={cn("h-4 w-4", isPlaying && "text-primary")} />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
