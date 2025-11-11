import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { VideoGenerationProvider } from "@/contexts/VideoGenerationContext";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <VideoGenerationProvider>
        <App />
      </VideoGenerationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
