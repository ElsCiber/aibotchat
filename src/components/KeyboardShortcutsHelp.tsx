import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

export function KeyboardShortcutsHelp() {
  const { language } = useLanguage();

  const shortcuts = [
    { keys: ["Ctrl", "N"], description: language === "es" ? "Nueva conversación" : "New conversation" },
    { keys: ["Ctrl", "K"], description: language === "es" ? "Buscar conversaciones" : "Search conversations" },
    { keys: ["Ctrl", "B"], description: language === "es" ? "Alternar sidebar" : "Toggle sidebar" },
    { keys: ["Ctrl", "/"], description: language === "es" ? "Mostrar atajos" : "Show shortcuts" },
    { keys: ["Esc"], description: language === "es" ? "Cerrar diálogos" : "Close dialogs" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title={language === "es" ? "Atajos de teclado" : "Keyboard shortcuts"}>
          <Keyboard className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>
            {language === "es" ? "Atajos de teclado" : "Keyboard Shortcuts"}
          </DialogTitle>
          <DialogDescription>
            {language === "es" 
              ? "Usa estos atajos para navegar más rápido" 
              : "Use these shortcuts to navigate faster"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
