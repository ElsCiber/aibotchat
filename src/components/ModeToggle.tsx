import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ModeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleMode}>
      {mode === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
