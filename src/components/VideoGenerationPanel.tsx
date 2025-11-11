import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoOrientationSelector } from "@/components/VideoOrientationSelector";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoGenerationPanelProps {
  onGenerate: (prompt: string, orientation: "horizontal" | "vertical") => void;
  onClose: () => void;
  isLoading: boolean;
}

export const VideoGenerationPanel = ({ onGenerate, onClose, isLoading }: VideoGenerationPanelProps) => {
  const [prompt, setPrompt] = useState("");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt, orientation);
      setPrompt("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="mb-4 p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Generación de Vídeo con Runway ML</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Describe el video que quieres generar..."
        className="bg-background"
        disabled={isLoading}
      />
      
      <VideoOrientationSelector
        orientation={orientation}
        onChange={setOrientation}
      />
      
      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading}
        className={cn(
          "w-full bg-gradient-to-r from-primary to-secondary",
          "hover:from-primary/90 hover:to-secondary/90"
        )}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {isLoading ? "Generando..." : "Generar Vídeo"}
      </Button>
    </div>
  );
};
