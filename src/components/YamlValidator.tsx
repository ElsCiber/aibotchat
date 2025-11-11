import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import yaml from "js-yaml";

interface ValidationError {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
}

interface YamlValidatorProps {
  content: string;
}

export const YamlValidator = ({ content }: YamlValidatorProps) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    validateYaml(content);
  }, [content]);

  const validateYaml = (yamlContent: string) => {
    const foundErrors: ValidationError[] = [];

    // Extract YAML from code blocks
    const yamlMatch = yamlContent.match(/```ya?ml\n([\s\S]*?)\n```/);
    const yamlText = yamlMatch ? yamlMatch[1] : yamlContent;

    if (!yamlText.trim()) {
      setErrors([]);
      setIsValid(null);
      return;
    }

    try {
      // Parse YAML
      const parsed = yaml.load(yamlText) as any;

      // Check if it's a Conditional Events structure
      if (parsed && typeof parsed === "object" && parsed.Events) {
        validateConditionalEvents(parsed, foundErrors, yamlText);
      }

      // Check for Server Variables structure
      if (parsed && typeof parsed === "object" && (parsed.variables || parsed.variable_type)) {
        validateServerVariables(parsed, foundErrors);
      }

      // General YAML checks
      performGeneralChecks(yamlText, foundErrors);

      setIsValid(foundErrors.filter(e => e.type === "error").length === 0);
      setErrors(foundErrors);
    } catch (error) {
      if (error instanceof Error) {
        foundErrors.push({
          type: "error",
          message: `Error de sintaxis YAML: ${error.message}`,
        });
      }
      setIsValid(false);
      setErrors(foundErrors);
    }
  };

  const validateConditionalEvents = (parsed: any, errors: ValidationError[], yamlText: string) => {
    const events = parsed.Events;

    Object.keys(events).forEach((eventName) => {
      const event = events[eventName];

      // Check for event type
      if (!event.type) {
        errors.push({
          type: "error",
          message: `Evento "${eventName}": Falta el campo obligatorio "type"`,
        });
      }

      // Check for valid event types
      const validTypes = [
        "player_interact", "player_death", "player_respawn", "player_kill",
        "player_command", "player_attack", "player_chat", "player_join", "player_quit",
        "block_interact", "block_break", "block_place",
        "item_consume", "item_craft", "item_repair", "item_drop", "item_pickup",
        "repetitive", "call"
      ];

      if (event.type && !validTypes.includes(event.type)) {
        errors.push({
          type: "warning",
          message: `Evento "${eventName}": El tipo "${event.type}" podría no ser válido. Tipos comunes: ${validTypes.slice(0, 5).join(", ")}...`,
        });
      }

      // Check for actions
      if (!event.actions) {
        errors.push({
          type: "error",
          message: `Evento "${eventName}": Falta el campo obligatorio "actions"`,
        });
      } else {
        // Check for cancel_event in actions
        const actionsStr = JSON.stringify(event.actions);
        if (!actionsStr.includes("cancel_event")) {
          errors.push({
            type: "warning",
            message: `Evento "${eventName}": Se recomienda incluir "cancel_event: true/false" en las acciones`,
          });
        }

        // Check for default action group
        if (!event.actions.default) {
          errors.push({
            type: "info",
            message: `Evento "${eventName}": No tiene grupo de acciones "default"`,
          });
        }
      }

      // Check conditions format
      if (event.conditions) {
        if (!Array.isArray(event.conditions)) {
          errors.push({
            type: "error",
            message: `Evento "${eventName}": "conditions" debe ser una lista (array)`,
          });
        } else {
          event.conditions.forEach((condition: string, idx: number) => {
            if (!condition.includes("execute")) {
              errors.push({
                type: "warning",
                message: `Evento "${eventName}", condición ${idx + 1}: Falta la palabra clave "execute"`,
              });
            }
            // Check for placeholder format
            if (!condition.includes("%")) {
              errors.push({
                type: "info",
                message: `Evento "${eventName}", condición ${idx + 1}: No se detectaron placeholders (%)`,
              });
            }
          });
        }
      }
    });

    // Check for comments in YAML (# inside code)
    const lines = yamlText.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") && !trimmed.startsWith("#!")) {
        errors.push({
          type: "warning",
          message: `Línea ${idx + 1}: Evita usar comentarios # dentro del código YAML. Las explicaciones van después del código.`,
          line: idx + 1,
        });
      }
    });
  };

  const validateServerVariables = (parsed: any, errors: ValidationError[]) => {
    // Check variable_type
    if (parsed.variable_type && !["PLAYER", "GLOBAL"].includes(parsed.variable_type)) {
      errors.push({
        type: "error",
        message: `variable_type debe ser "PLAYER" o "GLOBAL", no "${parsed.variable_type}"`,
      });
    }

    // Check value_type
    if (parsed.value_type && !["TEXT", "INTEGER", "DOUBLE"].includes(parsed.value_type)) {
      errors.push({
        type: "error",
        message: `value_type debe ser "TEXT", "INTEGER" o "DOUBLE", no "${parsed.value_type}"`,
      });
    }

    // Check for initial value
    if (parsed.value_type === "INTEGER" || parsed.value_type === "DOUBLE") {
      if (parsed.default_value !== undefined) {
        const val = parsed.default_value;
        if (parsed.value_type === "INTEGER" && !Number.isInteger(val)) {
          errors.push({
            type: "error",
            message: `default_value debe ser un número entero para value_type: INTEGER`,
          });
        }
      }
    }
  };

  const performGeneralChecks = (yamlText: string, errors: ValidationError[]) => {
    const lines = yamlText.split("\n");

    // Check for tabs (should use spaces)
    lines.forEach((line, idx) => {
      if (line.includes("\t")) {
        errors.push({
          type: "error",
          message: `Línea ${idx + 1}: Usa espacios en lugar de tabs para la indentación`,
          line: idx + 1,
        });
      }
    });

    // Check for common placeholder errors
    const placeholderPattern = /%[^%]+%/g;
    const allPlaceholders = yamlText.match(placeholderPattern) || [];
    
    allPlaceholders.forEach((placeholder) => {
      // Check for common typos
      if (placeholder.includes("palyer")) {
        errors.push({
          type: "error",
          message: `Placeholder mal escrito: "${placeholder}" (¿quisiste decir %player%?)`,
        });
      }
      
      // Check for spaces in placeholders
      if (placeholder.includes(" ") && !placeholder.includes("parseother")) {
        errors.push({
          type: "warning",
          message: `Placeholder con espacios: "${placeholder}" - Los placeholders no deben tener espacios`,
        });
      }
    });

    // Check for action format
    if (yamlText.includes("message:") || yamlText.includes("console_command:")) {
      const actionLines = lines.filter(line => 
        line.includes("message:") || 
        line.includes("console_command:") ||
        line.includes("player_command:")
      );

      actionLines.forEach((line, idx) => {
        const trimmed = line.trim();
        // Check if action is in quotes when it should be
        if (trimmed.startsWith("-") && !trimmed.includes("'") && !trimmed.includes('"')) {
          if (trimmed.includes("&") || trimmed.includes("%") || trimmed.includes(":")) {
            errors.push({
              type: "info",
              message: `Se recomienda usar comillas simples para acciones con caracteres especiales`,
            });
          }
        }
      });
    }
  };

  const getIcon = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getVariant = (type: ValidationError["type"]) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
    }
  };

  if (errors.length === 0 && isValid === null) return null;

  return (
    <Card className="p-4 my-4 bg-card border-border">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {isValid ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-semibold text-green-500">YAML Válido ✓</h3>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Problemas Detectados</h3>
            </>
          )}
          <Badge variant="outline" className="ml-auto">
            {errors.filter(e => e.type === "error").length} errores, {errors.filter(e => e.type === "warning").length} advertencias
          </Badge>
        </div>

        {errors.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.map((error, idx) => (
              <Alert key={idx} variant={getVariant(error.type)} className="py-2">
                <div className="flex items-start gap-2">
                  {getIcon(error.type)}
                  <AlertDescription className="text-xs flex-1">
                    {error.line && (
                      <span className="font-mono text-muted-foreground mr-2">
                        L{error.line}:
                      </span>
                    )}
                    {error.message}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {isValid && (
          <p className="text-xs text-muted-foreground">
            ✨ Tu configuración parece correcta. Recuerda probarla en tu servidor para verificar que funcione como esperas.
          </p>
        )}
      </div>
    </Card>
  );
};
