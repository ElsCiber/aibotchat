import React from "react";
import { useVideoGeneration } from "@/contexts/VideoGenerationContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const CooldownBanner = () => {
  const { cooldownSecondsLeft, cooldownUntil } = useVideoGeneration();
  const { language } = useLanguage();

  if (!cooldownUntil || cooldownSecondsLeft === 0) return null;

  const minutes = Math.floor(cooldownSecondsLeft / 60);
  const seconds = cooldownSecondsLeft % 60;
  const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Alert className="mb-4 border-orange-500/50 bg-orange-500/10">
      <AlertTriangle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="text-xs flex items-center gap-2 flex-wrap">
        <Clock className="h-3 w-3 text-orange-500" />
        {language === "es" ? (
          <>
            <span>
              <strong>Replicate en modo de espera:</strong> Los modelos de video están temporalmente desactivados debido a problemas de crédito o límite de tasa.
            </span>
            <span className="font-mono font-semibold text-orange-600">{timeText}</span>
            <span>restantes. Mientras tanto, se generarán storyboards automáticamente.</span>
          </>
        ) : (
          <>
            <span>
              <strong>Replicate cooldown:</strong> Video models are temporarily disabled due to credit or rate limit issues.
            </span>
            <span className="font-mono font-semibold text-orange-600">{timeText}</span>
            <span>remaining. Storyboards will be generated automatically instead.</span>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};
