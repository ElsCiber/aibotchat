import React from "react";
import { useVideoGeneration } from "@/contexts/VideoGenerationContext";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const VideoGenerationSettings = () => {
  const { mode, setMode, selectedModel, setSelectedModel } = useVideoGeneration();
  const { language } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
          title={language === "es" ? "Ajustes de generación" : "Generation settings"}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">
            {language === "es" ? "Preferencias de generación de video" : "Video generation preferences"}
          </h4>

          <div className="space-y-2">
            <Label className="text-xs">
              {language === "es" ? "Modo de generación" : "Generation mode"}
            </Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video_first" id="video_first" />
                <Label htmlFor="video_first" className="text-xs font-normal cursor-pointer">
                  {language === "es" 
                    ? "Intentar video primero (con fallback a storyboard)" 
                    : "Try video first (fallback to storyboard)"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="storyboard_only" id="storyboard_only" />
                <Label htmlFor="storyboard_only" className="text-xs font-normal cursor-pointer">
                  {language === "es" 
                    ? "Siempre generar storyboard (más rápido)" 
                    : "Always generate storyboard (faster)"}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "video_first" && (
            <div className="space-y-2">
              <Label htmlFor="model-select" className="text-xs">
                {language === "es" ? "Modelo preferido" : "Preferred model"}
              </Label>
              <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as any)}>
                <SelectTrigger id="model-select" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimax" className="text-xs">
                    MiniMax Video-01 {language === "es" ? "(mejor calidad)" : "(best quality)"}
                  </SelectItem>
                  <SelectItem value="animate-diff" className="text-xs">
                    AnimateDiff {language === "es" ? "(más rápido)" : "(faster)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            {language === "es"
              ? "Si el modelo seleccionado falla, se intentará con alternativas antes de usar storyboard."
              : "If the selected model fails, alternatives will be tried before using storyboard."}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
