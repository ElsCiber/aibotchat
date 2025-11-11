import { MonitorPlay, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoOrientationSelectorProps {
  orientation: "horizontal" | "vertical";
  onChange: (orientation: "horizontal" | "vertical") => void;
}

export const VideoOrientationSelector = ({ orientation, onChange }: VideoOrientationSelectorProps) => {
  return (
    <div className="flex gap-2 p-2 rounded-lg border border-border bg-secondary/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("horizontal")}
        className={cn(
          "flex-1 gap-2",
          orientation === "horizontal" && "bg-primary/10 text-primary border border-primary/20"
        )}
      >
        <MonitorPlay className="h-4 w-4" />
        <span className="text-xs">Horizontal</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("vertical")}
        className={cn(
          "flex-1 gap-2",
          orientation === "vertical" && "bg-primary/10 text-primary border border-primary/20"
        )}
      >
        <Smartphone className="h-4 w-4" />
        <span className="text-xs">Vertical</span>
      </Button>
    </div>
  );
};
