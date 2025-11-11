import React, { createContext, useContext, useState, useEffect } from "react";

type VideoGenerationMode = "video_first" | "storyboard_only";
type ReplicateModel = "minimax" | "animate-diff";

interface VideoGenerationContextType {
  mode: VideoGenerationMode;
  setMode: (mode: VideoGenerationMode) => void;
  selectedModel: ReplicateModel;
  setSelectedModel: (model: ReplicateModel) => void;
  cooldownUntil: number | null;
  setCooldownUntil: (time: number | null) => void;
  cooldownSecondsLeft: number;
}

const VideoGenerationContext = createContext<VideoGenerationContextType | undefined>(undefined);

export const VideoGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<VideoGenerationMode>("video_first");
  const [selectedModel, setSelectedModelState] = useState<ReplicateModel>("minimax");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("video_generation_mode") as VideoGenerationMode | null;
    const savedModel = localStorage.getItem("video_generation_model") as ReplicateModel | null;
    const savedCooldown = localStorage.getItem("video_cooldown_until");
    
    if (savedMode) setModeState(savedMode);
    if (savedModel) setSelectedModelState(savedModel);
    if (savedCooldown) {
      const cooldownTime = parseInt(savedCooldown, 10);
      if (cooldownTime > Date.now()) {
        setCooldownUntil(cooldownTime);
      } else {
        localStorage.removeItem("video_cooldown_until");
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSecondsLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((cooldownUntil - Date.now()) / 1000));
      setCooldownSecondsLeft(left);
      
      if (left === 0) {
        setCooldownUntil(null);
        localStorage.removeItem("video_cooldown_until");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const setMode = (newMode: VideoGenerationMode) => {
    setModeState(newMode);
    localStorage.setItem("video_generation_mode", newMode);
  };

  const setSelectedModel = (newModel: ReplicateModel) => {
    setSelectedModelState(newModel);
    localStorage.setItem("video_generation_model", newModel);
  };

  const handleSetCooldownUntil = (time: number | null) => {
    setCooldownUntil(time);
    if (time) {
      localStorage.setItem("video_cooldown_until", time.toString());
    } else {
      localStorage.removeItem("video_cooldown_until");
    }
  };

  return (
    <VideoGenerationContext.Provider
      value={{
        mode,
        setMode,
        selectedModel,
        setSelectedModel,
        cooldownUntil,
        setCooldownUntil: handleSetCooldownUntil,
        cooldownSecondsLeft,
      }}
    >
      {children}
    </VideoGenerationContext.Provider>
  );
};

export const useVideoGeneration = () => {
  const context = useContext(VideoGenerationContext);
  if (!context) {
    throw new Error("useVideoGeneration must be used within VideoGenerationProvider");
  }
  return context;
};
