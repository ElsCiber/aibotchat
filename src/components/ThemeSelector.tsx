import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const themes = [
  { id: "purple", name: { en: "Purple", es: "Púrpura" }, color: "bg-[hsl(250,70%,65%)]" },
  { id: "blue", name: { en: "Blue", es: "Azul" }, color: "bg-[hsl(210,85%,60%)]" },
  { id: "green", name: { en: "Green", es: "Verde" }, color: "bg-[hsl(150,70%,55%)]" },
  { id: "red", name: { en: "Red", es: "Rojo" }, color: "bg-[hsl(0,75%,65%)]" },
  { id: "orange", name: { en: "Orange", es: "Naranja" }, color: "bg-[hsl(30,85%,60%)]" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id as any)}
            className={theme === t.id ? "bg-muted" : ""}
          >
            <div className={`w-4 h-4 rounded-full mr-2 ${t.color}`} />
            {language === "es" ? t.name.es : t.name.en}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
