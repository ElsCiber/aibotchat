import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";

interface ModeSelectorProps {
  onModeSelect: (mode: "formal" | "developer") => void;
}

export function ModeSelector({ onModeSelect }: ModeSelectorProps) {
  const { language } = useLanguage();

  const modes = [
    {
      id: "formal" as const,
      icon: "💼",
      title: language === "es" ? "Modo Normal" : "Normal Mode",
      description: language === "es" 
        ? "Respuestas claras y concisas para uso general" 
        : "Clear and concise responses for general use",
    },
    {
      id: "developer" as const,
      icon: "⚙️",
      title: language === "es" ? "Modo Developer" : "Developer Mode",
      description: language === "es" 
        ? "Respuestas técnicas con código y detalles avanzados" 
        : "Technical responses with code and advanced details",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {language === "es" ? "Elige el modo de conversación" : "Choose conversation mode"}
          </h2>
          <p className="text-muted-foreground">
            {language === "es" 
              ? "Selecciona cómo quieres que responda el asistente" 
              : "Select how you want the assistant to respond"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modes.map((mode) => (
            <Card
              key={mode.id}
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-primary"
              onClick={() => onModeSelect(mode.id)}
            >
              <CardContent className="pt-6 pb-6 text-center space-y-3">
                <div className="text-4xl">{mode.icon}</div>
                <h3 className="text-lg font-semibold">{mode.title}</h3>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
