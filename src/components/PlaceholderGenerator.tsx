import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PlaceholderCategory = "player" | "target" | "block" | "item" | "parseother" | "svar" | "ce";

interface PlaceholderOption {
  value: string;
  label: string;
  description: string;
  example?: string;
}

const placeholderOptions: Record<PlaceholderCategory, PlaceholderOption[]> = {
  player: [
    { value: "%player%", label: "Nombre", description: "Nombre del jugador", example: "Steve" },
    { value: "%player_displayname%", label: "Display Name", description: "Nombre mostrado", example: "&c[Admin] Steve" },
    { value: "%player_uuid%", label: "UUID", description: "UUID del jugador", example: "069a79f4-44e9-4726-a5be-fca90e38aaf5" },
    { value: "%player_world%", label: "Mundo", description: "Mundo actual", example: "world" },
    { value: "%player_x%", label: "Coordenada X", description: "Posición X", example: "125" },
    { value: "%player_y%", label: "Coordenada Y", description: "Posición Y", example: "64" },
    { value: "%player_z%", label: "Coordenada Z", description: "Posición Z", example: "-342" },
    { value: "%player_health%", label: "Vida", description: "Vida actual", example: "18.5" },
    { value: "%player_max_health%", label: "Vida Máxima", description: "Vida máxima", example: "20" },
    { value: "%player_health_rounded%", label: "Vida Redondeada", description: "Vida redondeada", example: "19" },
    { value: "%player_food_level%", label: "Hambre", description: "Nivel de hambre", example: "18" },
    { value: "%player_level%", label: "Nivel XP", description: "Nivel de experiencia", example: "30" },
    { value: "%player_exp%", label: "Puntos XP", description: "Puntos de experiencia", example: "1250" },
    { value: "%player_gamemode%", label: "Gamemode", description: "Modo de juego", example: "SURVIVAL" },
    { value: "%player_ip%", label: "IP", description: "Dirección IP", example: "192.168.1.1" },
    { value: "%player_online%", label: "Online", description: "¿Está online?", example: "yes/no" },
    { value: "%player_item_in_hand%", label: "Item en Mano", description: "Item en mano principal", example: "DIAMOND_SWORD" },
    { value: "%player_item_in_offhand%", label: "Item Offhand", description: "Item en mano secundaria", example: "SHIELD" },
  ],
  target: [
    { value: "%target:player%", label: "Nombre", description: "Nombre del objetivo", example: "Alex" },
    { value: "%target:player_name%", label: "Nombre Alt", description: "Nombre del objetivo (alt)", example: "Alex" },
    { value: "%target:entity_type%", label: "Tipo Entidad", description: "Tipo de entidad", example: "ZOMBIE" },
    { value: "%target:player_health%", label: "Vida", description: "Vida del objetivo", example: "15.5" },
    { value: "%target:player_world%", label: "Mundo", description: "Mundo del objetivo", example: "world_nether" },
    { value: "%target:player_x%", label: "Coordenada X", description: "Posición X del objetivo", example: "200" },
    { value: "%target:player_y%", label: "Coordenada Y", description: "Posición Y del objetivo", example: "70" },
    { value: "%target:player_z%", label: "Coordenada Z", description: "Posición Z del objetivo", example: "-100" },
  ],
  block: [
    { value: "%block%", label: "Tipo", description: "Tipo de bloque", example: "DIAMOND_ORE" },
    { value: "%block_x%", label: "Coordenada X", description: "Posición X del bloque", example: "150" },
    { value: "%block_y%", label: "Coordenada Y", description: "Posición Y del bloque", example: "12" },
    { value: "%block_z%", label: "Coordenada Z", description: "Posición Z del bloque", example: "-200" },
    { value: "%block_world%", label: "Mundo", description: "Mundo del bloque", example: "world" },
  ],
  item: [
    { value: "%item%", label: "Material", description: "Material del item", example: "DIAMOND_SWORD" },
    { value: "%item_name%", label: "Nombre", description: "Nombre mostrado", example: "§6Espada Legendaria" },
    { value: "%item_durability%", label: "Durabilidad", description: "Durabilidad del item", example: "1561" },
  ],
  parseother: [
    { value: "parseother", label: "ParseOther", description: "Obtener placeholder de otro jugador", example: "%parseother_Steve_player_health%" },
    { value: "parseother_unsafe", label: "ParseOther Unsafe", description: "ParseOther sin verificar si está online", example: "%parseother_unsafe_{target:player}_{team_name}%" },
  ],
  svar: [
    { value: "%servervariables_value_", label: "Valor Variable", description: "Valor de variable del jugador", example: "%servervariables_value_coins%" },
    { value: "%servervariables_globalvalue_", label: "Valor Global", description: "Valor de variable global", example: "%servervariables_globalvalue_server_coins%" },
    { value: "%servervariables_display_", label: "Display Variable", description: "Display de variable del jugador", example: "%servervariables_display_level%" },
    { value: "%servervariables_globaldisplay_", label: "Display Global", description: "Display de variable global", example: "%servervariables_globaldisplay_total_players%" },
    { value: "%servervariables_value_otherplayer_", label: "Variable de Otro", description: "Variable de otro jugador", example: "%servervariables_value_otherplayer_kills:Steve%" },
  ],
  ce: [
    { value: "%random_1_100%", label: "Random", description: "Número aleatorio", example: "%random_1_100%" },
    { value: "%randomword_", label: "Random Word", description: "Palabra aleatoria de lista", example: "%randomword_50-100-200-500%" },
    { value: "%random_last%", label: "Random Last", description: "Último número aleatorio", example: "%random_last%" },
    { value: "%command%", label: "Comando", description: "Comando completo usado", example: "/heal Steve" },
    { value: "%main_command%", label: "Comando Principal", description: "Comando sin argumentos", example: "/heal" },
    { value: "%args_length%", label: "Cantidad Args", description: "Número de argumentos", example: "2" },
    { value: "%arg_1%", label: "Argumento", description: "Argumento en posición", example: "Steve" },
    { value: "%action_type%", label: "Tipo Acción", description: "Tipo de acción", example: "RIGHT_CLICK" },
    { value: "%victim%", label: "Víctima", description: "Víctima en ataque", example: "ZOMBIE" },
  ],
};

export const PlaceholderGenerator = () => {
  const [category, setCategory] = useState<PlaceholderCategory>("player");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [customInput, setCustomInput] = useState("");
  const [parseotherPlayer, setParseotherPlayer] = useState("Steve");
  const [parseotherPlaceholder, setParseotherPlaceholder] = useState("player_health");
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const generatePlaceholder = (): string => {
    if (!selectedOption) return "";

    if (category === "parseother") {
      if (selectedOption === "parseother") {
        return `%parseother_${parseotherPlayer}_${parseotherPlaceholder}%`;
      } else {
        return `%parseother_unsafe_{target:player}_{${parseotherPlaceholder}}%`;
      }
    }

    if (category === "svar" || category === "ce") {
      if (selectedOption.endsWith("_")) {
        return `${selectedOption}${customInput}%`;
      }
      if (selectedOption.includes("random_") && selectedOption !== "%random_last%") {
        return selectedOption;
      }
      if (selectedOption === "%randomword_") {
        return `%randomword_${customInput}%`;
      }
      if (selectedOption.startsWith("%arg_")) {
        return `%arg_${customInput || "1"}%`;
      }
      return selectedOption;
    }

    return selectedOption;
  };

  const handleCopy = async () => {
    const placeholder = generatePlaceholder();
    if (!placeholder) {
      toast({
        title: "Error",
        description: "Selecciona un placeholder primero",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(placeholder);
      setIsCopied(true);
      toast({
        title: "¡Copiado!",
        description: "Placeholder copiado al portapapeles",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el placeholder",
        variant: "destructive",
      });
    }
  };

  const currentOptions = placeholderOptions[category];
  const selectedDetails = currentOptions.find(opt => opt.value === selectedOption);
  const generatedPlaceholder = generatePlaceholder();

  const needsCustomInput = 
    (category === "svar" && selectedOption.endsWith("_")) ||
    (category === "ce" && (selectedOption === "%randomword_" || selectedOption.startsWith("%arg_")));

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-foreground">Generador de Placeholders</h3>
            <p className="text-sm text-muted-foreground">
              Crea placeholders para Conditional Events y PlaceholderAPI
            </p>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold">
            Categoría
          </Label>
          <Select value={category} onValueChange={(val) => {
            setCategory(val as PlaceholderCategory);
            setSelectedOption("");
            setCustomInput("");
          }}>
            <SelectTrigger id="category" className="bg-background border-border z-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              <SelectItem value="player">👤 Jugador</SelectItem>
              <SelectItem value="target">🎯 Objetivo</SelectItem>
              <SelectItem value="block">🧱 Bloque</SelectItem>
              <SelectItem value="item">⚔️ Item</SelectItem>
              <SelectItem value="parseother">🔄 ParseOther</SelectItem>
              <SelectItem value="svar">💾 Server Variables</SelectItem>
              <SelectItem value="ce">⚡ Conditional Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Placeholder Selection */}
        <div className="space-y-2">
          <Label htmlFor="placeholder" className="text-sm font-semibold">
            Placeholder
          </Label>
          <Select value={selectedOption} onValueChange={setSelectedOption}>
            <SelectTrigger id="placeholder" className="bg-background border-border z-40">
              <SelectValue placeholder="Selecciona un placeholder..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-border max-h-[300px] z-40">
              {currentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ParseOther specific inputs */}
        {category === "parseother" && selectedOption && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="space-y-2">
              <Label htmlFor="parseother-player" className="text-sm font-semibold">
                {selectedOption === "parseother" ? "Nombre del Jugador" : "Usar variable (ej: {target:player})"}
              </Label>
              <Input
                id="parseother-player"
                value={parseotherPlayer}
                onChange={(e) => setParseotherPlayer(e.target.value)}
                placeholder={selectedOption === "parseother" ? "Steve" : "{target:player}"}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parseother-placeholder" className="text-sm font-semibold">
                Placeholder a obtener
              </Label>
              <Input
                id="parseother-placeholder"
                value={parseotherPlaceholder}
                onChange={(e) => setParseotherPlaceholder(e.target.value)}
                placeholder="player_health"
                className="bg-background"
              />
            </div>
          </div>
        )}

        {/* Custom input for SVAR and CE */}
        {needsCustomInput && (
          <div className="space-y-2">
            <Label htmlFor="custom-input" className="text-sm font-semibold">
              {category === "svar" ? "Nombre de la variable" : "Valores (separados por -)"}
            </Label>
            <Input
              id="custom-input"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={
                category === "svar" 
                  ? "coins" 
                  : selectedOption === "%randomword_" 
                    ? "50-100-200-500" 
                    : "1"
              }
              className="bg-background"
            />
          </div>
        )}

        {/* Generated Placeholder Preview */}
        {generatedPlaceholder && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Placeholder Generado</Label>
            <div className="flex gap-2">
              <div className="flex-1 bg-background border-2 border-primary/30 rounded-lg px-4 py-3 font-mono text-sm text-primary">
                {generatedPlaceholder}
              </div>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="shrink-0 border-primary/30 hover:bg-primary/10"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Description and Example */}
            {selectedDetails && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <Badge variant="outline" className="mb-2">
                    Descripción
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {selectedDetails.description}
                  </p>
                </div>
                {selectedDetails.example && (
                  <div>
                    <Badge variant="outline" className="mb-2">
                      Ejemplo de valor
                    </Badge>
                    <p className="text-sm font-mono text-foreground bg-background px-2 py-1 rounded">
                      {selectedDetails.example}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Usage Example */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="text-sm font-semibold mb-2 text-foreground">💡 Ejemplo de uso en Conditional Events:</h4>
              <code className="text-xs font-mono text-foreground block bg-background p-3 rounded border border-border overflow-x-auto">
                conditions:{"\n"}
                - '{generatedPlaceholder} == valor execute accion_nombre'
              </code>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
          <p>💡 <strong>Tip:</strong> Los placeholders siempre van entre signos de porcentaje %</p>
          <p>🔍 <strong>Nota:</strong> Algunos placeholders requieren plugins adicionales instalados</p>
        </div>
      </div>
    </Card>
  );
};
