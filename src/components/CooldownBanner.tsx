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
              <strong>Replicate sin crédito:</strong> Necesitas agregar crédito en{" "}
              <a href="https://replicate.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                replicate.com/billing
              </a>{" "}
              para usar modelos de video. 
            </span>
            <span className="font-mono font-semibold text-orange-600">{timeText}</span>
            <span>hasta próximo intento. Usa storyboard (gratis) mientras tanto.</span>
          </>
        ) : (
          <>
            <span>
              <strong>Replicate out of credit:</strong> You need to add credit at{" "}
              <a href="https://replicate.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                replicate.com/billing
              </a>{" "}
              to use video models.
            </span>
            <span className="font-mono font-semibold text-orange-600">{timeText}</span>
            <span>until next retry. Use storyboard (free) meanwhile.</span>
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};
