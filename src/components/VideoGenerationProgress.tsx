import { Progress } from "@/components/ui/progress";
import { Video } from "lucide-react";

interface VideoGenerationProgressProps {
  progress: number;
  estimatedTime: string;
}

export const VideoGenerationProgress = ({ progress, estimatedTime }: VideoGenerationProgressProps) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 animate-pulse text-primary" />
        <span className="text-sm font-medium">Generando vídeo...</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress}%</span>
        <span>Tiempo estimado: {estimatedTime}</span>
      </div>
    </div>
  );
};
