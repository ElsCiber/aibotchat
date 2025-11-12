import { CreditCard, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function CreditBalance() {
  const { language } = useLanguage();

  const handleOpenSettings = () => {
    // This will open in a new window since it's a Lovable platform URL
    window.open('https://lovable.dev/settings', '_blank');
  };

  return (
    <div className="px-4 py-3 border-t border-border">
      <button
        onClick={handleOpenSettings}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="flex-shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-foreground">
            {language === "es" ? "Créditos" : "Credits"}
          </div>
          <div className="text-xs text-muted-foreground">
            {language === "es" ? "Ver y agregar créditos" : "View and add credits"}
          </div>
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>
    </div>
  );
}
