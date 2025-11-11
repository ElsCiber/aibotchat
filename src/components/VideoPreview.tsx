import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface VideoPreviewProps {
  progress: number;
  estimatedTime: string;
}

export const VideoPreview = ({ progress, estimatedTime }: VideoPreviewProps) => {
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);

  // Simular frame de previsualización basado en el progreso
  useEffect(() => {
    if (progress > 30 && !previewFrame) {
      // En una implementación real, esto vendría del backend
      // Por ahora mostramos un placeholder
      setPreviewFrame("generating");
    }
  }, [progress, previewFrame]);

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-video bg-muted/30 rounded-lg overflow-hidden border border-border">
        {previewFrame ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Generando vista previa...</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Iniciando generación...</p>
            </div>
          </div>
        )}
        
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Tiempo estimado:</span>
        <span className="font-medium text-foreground">{estimatedTime}</span>
      </div>
    </div>
  );
};
