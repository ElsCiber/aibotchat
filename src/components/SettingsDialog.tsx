import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ModeToggle } from "@/components/ModeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

export function SettingsDialog() {
  const { language } = useLanguage();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Configuración" : "Settings"}
          </DialogTitle>
          <DialogDescription>
            {language === "es" 
              ? "Personaliza la apariencia de la interfaz" 
              : "Customize the interface appearance"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {language === "es" ? "Modo de visualización" : "Display Mode"}
            </h4>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <span className="text-sm text-muted-foreground">
                {language === "es" ? "Cambiar entre claro/oscuro" : "Switch between light/dark"}
              </span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {language === "es" ? "Tema de color" : "Color Theme"}
            </h4>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <span className="text-sm text-muted-foreground">
                {language === "es" ? "Selecciona tu paleta de colores" : "Select your color palette"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
