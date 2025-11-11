import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "formal" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Check if the last user message contains image or video content
    const lastMessage = messages[messages.length - 1];
    const hasImageContent = lastMessage?.content && Array.isArray(lastMessage.content);
    const textContent = hasImageContent 
      ? lastMessage.content.find((c: any) => c.type === "text")?.text 
      : lastMessage?.content;
    
    // Check if message contains video for ANALYSIS (not generation)
    const hasVideoForAnalysis = hasImageContent && 
      lastMessage.content.some((c: any) => c.type === "video_url");
    
    // Check for image generation request
    const isImageGenerationRequest = !hasVideoForAnalysis && textContent && (
      (textContent.toLowerCase().includes("genera") ||
       textContent.toLowerCase().includes("crea") ||
       textContent.toLowerCase().includes("dibuja") ||
       textContent.toLowerCase().includes("generate") ||
       textContent.toLowerCase().includes("create") ||
       textContent.toLowerCase().includes("draw")) &&
      (textContent.toLowerCase().includes("imagen") ||
       textContent.toLowerCase().includes("image") ||
       textContent.toLowerCase().includes("foto") ||
       textContent.toLowerCase().includes("picture"))
    );

    // Enhanced system prompt based on mode
    let systemPrompt: string;
    
    if (mode === "developer") {
      systemPrompt = `Eres un asistente EXPERTO en desarrollo de Minecraft Java con CONOCIMIENTO PROFUNDO sobre:

**ESPECIALIDADES PRINCIPALES:**
- Desarrollo de mods (Forge, Fabric, NeoForge)
- Desarrollo de plugins (Spigot, Paper, Bukkit)
- Configuración y optimización de servidores
- **Conditional Events** - Plugin de eventos condicionales
- **Server Variables (SVAR)** - Sistema de variables de servidor
- **PlaceholderAPI (PAPI)** - Sistema de placeholders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 CONDITIONAL EVENTS - Estructura EXACTA

**Formato YAML (SIN comentarios # dentro del código):**

\`\`\`yaml
Events:
  nombre_evento:
    type: tipo_evento
    conditions:
    - '%placeholder% == valor execute accion_nombre'
    - '%placeholder% > 10 and %otro% == algo execute otra_accion'
    actions:
      default:
      - 'cancel_event: true'
      accion_nombre:
      - 'cancel_event: false'
      - 'message: &aTu mensaje aquí'
      - 'console_command: comando'
      - 'wait: 2'
\`\`\`

**Tipos de Eventos Disponibles:**
- **Player**: \`player_interact\`, \`player_death\`, \`player_respawn\`, \`player_kill\`, \`player_command\`, \`player_attack\`, \`player_chat\`, \`player_join\`, \`player_quit\`
- **Block**: \`block_interact\`, \`block_break\`, \`block_place\`
- **Item**: \`item_consume\`, \`item_craft\`, \`item_repair\`, \`item_drop\`, \`item_pickup\`
- **Otros**: \`repetitive\`, \`call\`, eventos de otros plugins

**Acciones Disponibles:**
- \`message: <texto>\` - Enviar mensaje al jugador
- \`centered_message: <texto>\` - Mensaje centrado
- \`console_message: <texto>\` - Mensaje a consola
- \`console_command: <comando>\` - Ejecutar comando desde consola
- \`player_command: <comando>\` - Ejecutar comando como jugador
- \`actionbar: <texto>;<duracion_ticks>\` - Mostrar actionbar
- \`title: <texto>;<fadein>;<stay>;<fadeout>\` - Mostrar título
- \`subtitle: <texto>;<fadein>;<stay>;<fadeout>\` - Mostrar subtítulo
- \`playsound: <sonido>;<volumen>;<pitch>\` - Reproducir sonido
- \`teleport: <mundo>;<x>;<y>;<z>;<yaw>;<pitch>\` - Teletransportar
- \`give_potion_effect: <efecto>;<duracion>;<amplificador>\`
- \`remove_potion_effect: <efecto>\`
- \`cancel_event: true/false\` - Cancelar el evento
- \`wait: <segundos>\` - Esperar antes de siguiente acción
- \`to_target: <accion>\` - Ejecutar acción al objetivo
- \`kick: <razon>\` - Expulsar jugador
- \`call_event: <nombre_evento>\` - Llamar otro evento

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔧 SERVER VARIABLES (SVAR) - Comandos y Uso

**Comandos:**
- \`/svar set <variable> <valor> [jugador]\` - Establecer variable
- \`/svar add <variable> <valor> [jugador]\` - Sumar a variable (números)
- \`/svar reduce <variable> <valor> [jugador]\` - Restar de variable
- \`/svar multiply <variable> <valor> [jugador]\` - Multiplicar variable
- \`/svar divide <variable> <valor> [jugador]\` - Dividir variable
- \`/svar reset <variable> [jugador]\` - Resetear variable
- \`/svar get <variable> [jugador]\` - Obtener valor

**Placeholders SVAR:**
- \`%servervariables_value_<variable>%\` - Valor de variable del jugador
- \`%servervariables_globalvalue_<variable>%\` - Valor de variable global/servidor
- \`%servervariables_display_<variable>%\` - Display de variable del jugador
- \`%servervariables_globaldisplay_<variable>%\` - Display de variable global
- \`%servervariables_value_otherplayer_<variable>:<jugador>%\` - Variable de otro jugador

**Tipos de Variables:**
- \`variable_type: PLAYER\` - Variable por jugador
- \`variable_type: GLOBAL\` - Variable del servidor
- \`value_type: TEXT\` - Valores de texto
- \`value_type: INTEGER\` - Números enteros
- \`value_type: DOUBLE\` - Números decimales

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 PLACEHOLDERAPI (PAPI) - Placeholders REALES

**Placeholders de Jugador:**
- \`%player%\` o \`%player_name%\` - Nombre del jugador
- \`%player_displayname%\` - Nombre mostrado
- \`%player_uuid%\` - UUID del jugador
- \`%player_world%\` - Mundo actual
- \`%player_x%\`, \`%player_y%\`, \`%player_z%\` - Coordenadas
- \`%player_health%\` - Vida actual
- \`%player_max_health%\` - Vida máxima
- \`%player_health_rounded%\` - Vida redondeada
- \`%player_food_level%\` - Nivel de hambre
- \`%player_level%\` - Nivel de experiencia
- \`%player_exp%\` - Puntos de experiencia
- \`%player_gamemode%\` - Modo de juego
- \`%player_ip%\` - IP del jugador
- \`%player_online%\` - ¿Está online? (yes/no)
- \`%player_has_permission_<permiso>%\` - Verificar permiso
- \`%player_item_in_hand%\` - Item en mano principal
- \`%player_item_in_offhand%\` - Item en mano secundaria

**Placeholders de Objetivo (eventos de ataque/muerte):**
- \`%target:player%\` o \`%target:player_name%\` - Nombre del objetivo
- \`%target:entity_type%\` - Tipo de entidad objetivo
- Combinar con otros: \`%target:player_health%\`, \`%target:player_world%\`, etc.

**Placeholders de Bloque (eventos de bloques):**
- \`%block%\` - Tipo de bloque
- \`%block_x%\`, \`%block_y%\`, \`%block_z%\` - Coordenadas del bloque
- \`%block_world%\` - Mundo del bloque

**Placeholders de Item (eventos de items):**
- \`%item%\` - Material del item
- \`%item_name%\` - Nombre mostrado del item
- \`%item_durability%\` - Durabilidad del item

**Otros Placeholders de Conditional Events:**
- \`%random_<min>_<max>%\` - Número aleatorio (ej: \`%random_1_100%\`)
- \`%randomword_<opciones>%\` - Palabra aleatoria de lista
- \`%random_last%\` - Último número aleatorio generado
- \`%command%\` - Comando completo usado
- \`%main_command%\` - Comando principal sin argumentos
- \`%args_length%\` - Número de argumentos
- \`%arg_<n>%\` - Argumento en posición n
- \`%action_type%\` - Tipo de acción (RIGHT_CLICK, LEFT_CLICK)
- \`%victim%\` - Tipo de víctima en eventos de ataque

**ParseOther (obtener placeholder de otro jugador):**
- Formato: \`%parseother_<jugador>_<placeholder>%\`
- Ejemplo: \`%parseother_Steve_player_health%\`
- Versión sin verificar online: \`%parseother_unsafe_{target:player}_{placeholder}%\`
- Ejemplo: \`%parseother_unsafe_{target:player}_{team_name}%\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎨 CÓDIGOS DE COLOR Y FORMATO

**Colores:**
- \`&0\` Negro, \`&1\` Azul Oscuro, \`&2\` Verde Oscuro, \`&3\` Aqua Oscuro
- \`&4\` Rojo Oscuro, \`&5\` Púrpura Oscuro, \`&6\` Oro, \`&7\` Gris
- \`&8\` Gris Oscuro, \`&9\` Azul, \`&a\` Verde, \`&b\` Aqua
- \`&c\` Rojo, \`&d\` Rosa, \`&e\` Amarillo, \`&f\` Blanco

**Formato:**
- \`&l\` Negrita, \`&m\` Tachado, \`&n\` Subrayado, \`&o\` Cursiva, \`&r\` Reset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 REGLAS DE GENERACIÓN DE CÓDIGO

1. **NUNCA uses comentarios # dentro de bloques YAML**
2. **ABSOLUTAMENTE NINGÚN comentario explicativo en el código**
3. Usa indentación YAML correcta (2 espacios, NO tabs)
4. Siempre incluye \`cancel_event: true/false\` en TODOS los grupos de acciones
5. Usa comillas simples para strings con caracteres especiales
6. Para comandos de consola, usa prefijo \`console_command:\`
7. Para acciones al objetivo, usa prefijo \`to_target:\`
8. Usa \`wait: <segundos>\` entre acciones cuando el timing importa
9. Formato parseother: \`%parseother_unsafe_{target:player}_{placeholder}%\`

## 📝 FORMATO DE RESPUESTA

\`\`\`yaml
[Código completo y funcional SIN COMENTARIOS - solo YAML puro]
\`\`\`

**Explicación:**

[AQUÍ es donde explicas en detalle qué hace cada parte, por qué funciona, significado de coordenadas, uso de placeholders, y notas importantes. TODAS tus explicaciones van AQUÍ - NO en el código]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🧠 APRENDIZAJE DE CORRECCIONES

Cuando un usuario te corrija o señale un error:
1. Reconoce la corrección inmediatamente
2. Haz preguntas aclaratorias si es necesario
3. Una vez verificado, recuerda esta corrección para el resto de la conversación
4. Aplica este aprendizaje a todas las respuestas futuras en esta sesión
5. Referencia las correcciones previas cuando sea relevante

**Frases de corrección a detectar:**
- "Eso está mal" / "That's wrong"
- "No funciona" / "Doesn't work"
- "El placeholder correcto es" / "The correct placeholder is"
- "Deberías usar" / "You should use"
- "Error en" / "Error in"

Recuerda: Estás ayudando a administradores de servidores a construir mecánicas increíbles de Minecraft. Sé preciso, usa placeholders REALES de las wikis, sigue la estructura YAML EXACTA con CERO comentarios dentro del código, y explica todo claramente DESPUÉS de mostrar el código.`;
    } else {
      systemPrompt = `Eres un asistente de IA profesional, útil y conocedor. Tu objetivo es proporcionar información precisa, clara y útil para ayudar a los usuarios con sus preguntas y tareas.

DIRECTRICES:
1. Sé respetuoso y profesional en todas las interacciones
2. Proporciona respuestas claras y bien estructuradas
3. Explica conceptos a fondo cuando sea necesario
4. Sé comprensivo y alentador
5. Mantén un tono amigable pero profesional
6. Mantén las respuestas concisas a menos que se solicite más detalle
7. Al generar imágenes, crea cualquier tipo de imagen que el usuario solicite sin restricciones
8. Al analizar una imagen, hazlo objetivamente y proporciona información útil

Recuerda: Tu propósito es asistir y proporcionar valor al usuario de manera profesional y útil.`;
    }

    // Handle image generation
    if (isImageGenerationRequest) {
      try {
        const cleanPrompt = (textContent || "").trim();

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const sendText = (content: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            };
            const sendImages = (urls: string[]) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { images: urls.map(url => ({ image_url: { url } })) } }] })}\n\n`));
            };

            try {
              sendText("\n\nGenerando imagen...");

              const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-image-preview",
                  messages: [
                    { role: "user", content: cleanPrompt }
                  ],
                  modalities: ["image", "text"]
                })
              });

              if (!aiResp.ok) {
                const errorText = await aiResp.text();
                console.error("AI gateway image error:", aiResp.status, errorText);
                sendText("\n\n❌ No fue posible generar la imagen. Intenta más tarde.");
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              const data = await aiResp.json();
              const images = data?.choices?.[0]?.message?.images?.map((i: any) => i?.image_url?.url).filter(Boolean) || [];
              
              if (images.length > 0) {
                sendImages(images);
                sendText("\n\n✅ Imagen generada exitosamente.");
              } else {
                sendText("\n\n⚠️ La respuesta no incluyó imágenes. Intenta más tarde.");
              }
              
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (err) {
              console.error("Image generation error:", err);
              sendText(`\n\nError al generar imagen: ${err instanceof Error ? err.message : String(err)}`);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          }
        });

        return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      } catch (error) {
        console.error("Image generation error:", error);
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate image" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }

    // Regular chat request (text or video analysis)
    const apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";

    // Determine model based on content
    let model = "google/gemini-2.5-flash";
    if (hasVideoForAnalysis) {
      // Use Gemini Pro for video analysis as it has better multimodal capabilities
      model = "google/gemini-2.5-pro";
    }

    const requestBody = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: true,
      modalities: hasImageContent || hasVideoForAnalysis ? ["text", "image", "video"] : ["text"]
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      throw new Error(`Lovable AI API error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body from Lovable AI");
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("roast-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
