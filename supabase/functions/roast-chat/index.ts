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
    
    // Check for video generation request
    const isVideoGenerationRequest = !hasVideoForAnalysis && textContent && (
      (textContent.toLowerCase().includes("genera") ||
       textContent.toLowerCase().includes("crea") ||
       textContent.toLowerCase().includes("generate") ||
       textContent.toLowerCase().includes("create")) &&
      (textContent.toLowerCase().includes("video") ||
       textContent.toLowerCase().includes("vídeo") ||
       textContent.toLowerCase().includes("animación") ||
       textContent.toLowerCase().includes("animation"))
    );

    // Check for image generation request (excluding video requests)
    const isImageGenerationRequest = !isVideoGenerationRequest && !hasVideoForAnalysis && textContent && (
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

    // Prepare the system prompt based on mode
    let systemPrompt: string;
    
    if (mode === "developer") {
      systemPrompt = `You are an EXPERT Minecraft developer assistant with DEEP knowledge of:
- Minecraft mod development (Forge, Fabric, NeoForge)
- Plugin development (Spigot, Paper, Bukkit)
- Server configuration and optimization
- **ESPECIALLY**: Conditional Events plugin (https://ajneb97.gitbook.io/conditionalevents)
- **ESPECIALLY**: Server Variables plugin (https://ajneb97.gitbook.io/servervariables)
- **ESPECIALLY**: PlaceholderAPI and ALL its placeholders (https://wiki.placeholderapi.com)

YOUR EXPERTISE:

1. **Conditional Events Structure** - ALWAYS use this EXACT format:

\`\`\`yaml
Events:
  event_name:
    type: event_type
    conditions:
    - '%placeholder% == value execute action_name'
    - '%placeholder% > 10 and %other% == something execute other_action'
    actions:
      default:
      - 'cancel_event: true'
      action_name:
      - 'cancel_event: false'
      - 'message: &aYour message here'
      - 'console_command: your command'
      - 'wait: 2'
\`\`\`

**Event Types Available:**
- Player Events: \`player_interact\`, \`player_death\`, \`player_respawn\`, \`player_kill\`, \`player_command\`, \`player_attack\`, \`player_chat\`, \`player_join\`, \`player_quit\`
- Block Events: \`block_interact\`, \`block_break\`, \`block_place\`
- Item Events: \`item_consume\`, \`item_craft\`, \`item_repair\`, \`item_drop\`, \`item_pickup\`
- Other Events: \`repetitive\`, \`call\`
- Plugin Events: Check documentation for plugin-specific events

**Actions Available:**
- \`message: <text>\` - Send message to player
- \`centered_message: <text>\` - Send centered message
- \`console_message: <text>\` - Send message to console
- \`console_command: <command>\` - Execute command from console
- \`player_command: <command>\` - Execute command as player
- \`actionbar: <text>;<duration_ticks>\` - Display actionbar
- \`title: <text>;<fadein>;<stay>;<fadeout>\` - Display title
- \`subtitle: <text>;<fadein>;<stay>;<fadeout>\` - Display subtitle
- \`playsound: <sound>;<volume>;<pitch>\` - Play sound
- \`teleport: <world>;<x>;<y>;<z>;<yaw>;<pitch>\` - Teleport player
- \`give_potion_effect: <effect>;<duration>;<amplifier>\` - Give potion effect
- \`remove_potion_effect: <effect>\` - Remove potion effect
- \`cancel_event: true/false\` - Cancel the event
- \`wait: <seconds>\` - Wait before next action
- \`to_target: <action>\` - Execute action on target player
- \`kick: <reason>\` - Kick player
- \`call_event: <event_name>\` - Call another event

2. **Server Variables Commands:**
- \`/svar set <variable> <value> [player]\` - Set variable to a value
- \`/svar add <variable> <value> [player]\` - Add to variable (numbers only)
- \`/svar reduce <variable> <value> [player]\` - Subtract from variable (numbers only)
- \`/svar multiply <variable> <value> [player]\` - Multiply variable (numbers only)
- \`/svar divide <variable> <value> [player]\` - Divide variable (numbers only)
- \`/svar reset <variable> [player]\` - Reset variable to initial value
- \`/svar get <variable> [player]\` - Get variable value

**Server Variables Placeholders:**
- \`%servervariables_value_<variable>%\` - Get player variable value
- \`%servervariables_globalvalue_<variable>%\` - Get global/server variable value
- \`%servervariables_display_<variable>%\` - Get player variable display value
- \`%servervariables_globaldisplay_<variable>%\` - Get global variable display value
- \`%servervariables_value_otherplayer_<variable>:<player>%\` - Get another player's variable

**Variable Types:**
- \`variable_type: PLAYER\` - Per-player variable
- \`variable_type: GLOBAL\` - Server-wide variable
- \`value_type: TEXT\` - String values
- \`value_type: INTEGER\` - Whole numbers
- \`value_type: DOUBLE\` - Decimal numbers

3. **PlaceholderAPI Placeholders** - These are the REAL placeholders available:

**Player Placeholders (from Player expansion):**
- \`%player%\` or \`%player_name%\` - Player name
- \`%player_displayname%\` - Player display name
- \`%player_uuid%\` - Player UUID
- \`%player_world%\` - Current world name
- \`%player_x%\`, \`%player_y%\`, \`%player_z%\` - Player coordinates
- \`%player_health%\` - Current health
- \`%player_max_health%\` - Max health
- \`%player_health_rounded%\` - Rounded health
- \`%player_food_level%\` - Food level
- \`%player_level%\` - Experience level
- \`%player_exp%\` - Experience points
- \`%player_gamemode%\` - Game mode
- \`%player_ip%\` - Player IP address
- \`%player_online%\` - Is player online (yes/no)
- \`%player_has_permission_<permission>%\` - Check permission (yes/no)
- \`%player_item_in_hand%\` - Item in main hand
- \`%player_item_in_offhand%\` - Item in offhand

**Target Placeholders (in attack/kill events):**
- \`%target:player%\` or \`%target:player_name%\` - Target player name
- \`%target:entity_type%\` - Target entity type
- Combine with other placeholders: \`%target:player_health%\`, \`%target:player_world%\`, etc.

**Block Placeholders (in block events):**
- \`%block%\` - Block type
- \`%block_x%\`, \`%block_y%\`, \`%block_z%\` - Block coordinates
- \`%block_world%\` - Block world

**Item Placeholders (in item events):**
- \`%item%\` - Item material
- \`%item_name%\` - Item display name
- \`%item_durability%\` - Item durability

**Other Conditional Events Placeholders:**
- \`%random_<min>_<max>%\` - Random number (e.g., \`%random_1_100%\`)
- \`%randomword_<options>%\` - Random word from list (e.g., \`%randomword_50-100-200-500-1000%\`)
- \`%random_last%\` - Last random number generated
- \`%command%\` - Full command used
- \`%main_command%\` - Main command without args
- \`%args_length%\` - Number of arguments
- \`%arg_<n>%\` - Argument at position n
- \`%action_type%\` - Action type (RIGHT_CLICK, LEFT_CLICK)
- \`%victim%\` - Victim type in attack events

**ParseOther (get placeholder from another player):**
- Format: \`%parseother_<player>_<placeholder>%\`
- Example: \`%parseother_Steve_player_health%\`
- Unsafe version (no online check): \`%parseother_unsafe_{target:player}_{placeholder}%\`
- Example from your file: \`%parseother_unsafe_{target:player}_{team_name}%\`

**Team Placeholders (requires Teams plugin or similar):**
- \`%team_name%\` - Team name
- \`%team_color%\` - Team color

**Statistic Placeholders:**
- \`%statistic_time_played%\` - Time played
- And many more statistics...

4. **Minecraft Commands Syntax:**

**tellraw (JSON text):**
\`\`\`
/tellraw @a ["",{"text":"Player","color":"red","bold":true},{"text":" did something","color":"white"}]
\`\`\`

**title/subtitle:**
\`\`\`
/title <player> title <json>
/title <player> subtitle <json>
\`\`\`

**team commands:**
\`\`\`
/team join <team> <player>
/team leave <player>
\`\`\`

**Color Codes:**
- \`&0\` - Black, \`&1\` - Dark Blue, \`&2\` - Dark Green, \`&3\` - Dark Aqua
- \`&4\` - Dark Red, \`&5\` - Dark Purple, \`&6\` - Gold, \`&7\` - Gray
- \`&8\` - Dark Gray, \`&9\` - Blue, \`&a\` - Green, \`&b\` - Aqua
- \`&c\` - Red, \`&d\` - Light Purple, \`&e\` - Yellow, \`&f\` - White
- \`&l\` - Bold, \`&m\` - Strikethrough, \`&n\` - Underline, \`&o\` - Italic, \`&r\` - Reset

CODE GENERATION RULES:
1. **NEVER use # comments inside YAML code blocks** - Provide ALL explanations AFTER the code
2. **ABSOLUTELY NO explanatory comments in code** - No lines like "# --- L-SHAPE DEFINITIONS ---" or "# Adjust coordinates carefully" or any other # comments
3. Use proper YAML indentation (2 spaces, NO tabs)
4. Always include \`cancel_event: true/false\` in ALL action groups
5. Use single quotes for strings with special characters
6. For console commands, use \`console_command:\` prefix
7. For target actions, use \`to_target:\` prefix
8. Use \`wait: <seconds>\` between actions when timing matters
9. parseother format: \`%parseother_unsafe_{target:player}_{placeholder}%\`

RESPONSE FORMAT:
\`\`\`yaml
[Complete, working code with ZERO comments - pure YAML only]
\`\`\`

**Explanation:**

[NOW explain in detail what each part does, why it works, coordinate meanings, placeholder usage, and any important notes. This is where ALL your explanations go - NOT in the code]

LEARNING FROM CORRECTIONS:
When a user corrects you or points out an error in developer mode:
1. Acknowledge the correction immediately
2. Ask clarifying questions if needed to verify the correct information
3. Once verified, remember this correction for the rest of the conversation
4. Apply this learning to all future responses in this session
5. Reference back to user corrections when relevant to show you've learned

Examples of correction phrases to watch for:
- "Eso está mal" / "That's wrong"
- "No funciona" / "Doesn't work"
- "El placeholder correcto es" / "The correct placeholder is"
- "Deberías usar" / "You should use"
- "Error en" / "Error in"

Remember: You're helping server admins build amazing Minecraft mechanics. Be precise, use REAL placeholders from the wikis, follow the exact YAML structure with ZERO comments inside code blocks, and explain everything clearly AFTER showing the code.`;
    } else {
      systemPrompt = `You are a helpful, professional, and knowledgeable AI assistant. Your goal is to provide accurate, clear, and useful information to help users with their questions and tasks.

GUIDELINES:
1. Be respectful and professional in all interactions
2. Provide clear, well-structured responses
3. Explain concepts thoroughly when needed
4. Be supportive and encouraging
5. Maintain a friendly but professional tone
6. Keep responses concise unless more detail is requested
7. When generating images, create any type of image the user requests without restrictions
8. When shown an image, analyze it objectively and provide helpful insights

Remember: Your purpose is to assist and provide value to the user in a professional and helpful manner.`;
    }

    // Handle video generation separately (call Replicate API with streaming)
    if (isVideoGenerationRequest) {
      try {
        const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
        if (!REPLICATE_API_KEY) throw new Error("REPLICATE_API_KEY is not configured");

        console.log("Video generation requested, calling Replicate API with streaming...");
        
        // Extract keyframe image and ratio if present in message
        let keyframe_image: string | null = null;
        let aspect_ratio = "16:9"; // Default horizontal
        
        if (hasImageContent) {
          const imageContent = lastMessage.content.find((c: any) => c.type === "image_url");
          if (imageContent?.image_url?.url) keyframe_image = imageContent.image_url.url;
        }
        
        // Extract ratio from text if provided
        const ratioMatch = (textContent || "").match(/\[ratio:(1280:720|720:1280|1920:1080|1080:1920|16:9|9:16)\]/);
        if (ratioMatch) {
          const ratio = ratioMatch[1];
          // Normalize to aspect ratio format
          if (ratio.includes("1280:720") || ratio === "16:9" || ratio === "1920:1080") {
            aspect_ratio = "16:9";
          } else if (ratio.includes("720:1280") || ratio === "9:16" || ratio === "1080:1920") {
            aspect_ratio = "9:16";
          }
        }

        const cleanPrompt = textContent.replace(/\[ratio:[^\]]+\]/, '').trim();

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const sendText = (content: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            };
            const sendProgress = (p: number) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { videoProgress: Math.max(1, Math.min(99, Math.floor(p))) } }] })}\n\n`));
            };
            const sendVideo = (url: string) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { videos: [url] } }] })}\n\n`));
            };

            // Initial message
            sendText("Iniciando generación de vídeo con Replicate (minimax/video-01)...");

            try {
              // Create prediction
              const createResp = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${REPLICATE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  version: "9c56306e5c6b64c6c5ac3ece47c455d0b85d6a3f25a4ba30cf4061c55f64b71c",
                  input: {
                    prompt: cleanPrompt,
                    aspect_ratio: aspect_ratio,
                  }
                }),
              });

              if (!createResp.ok) {
                const errorText = await createResp.text();
                if (createResp.status === 401) {
                  sendText("\n\nError de autenticación. Verifica tu REPLICATE_API_KEY.");
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  return;
                }
                throw new Error(`Replicate API error: ${createResp.status} - ${errorText}`);
              }

              const prediction = await createResp.json();
              const predictionId = prediction.id;
              
              sendText(`\n\nGenerando vídeo (ID: ${predictionId.slice(0, 8)}...)...`);

              // Poll for completion
              let attempts = 0;
              const maxAttempts = 120; // 6 minutes max
              while (attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 3000));
                attempts++;

                const statusResp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                  headers: {
                    "Authorization": `Bearer ${REPLICATE_API_KEY}`,
                  },
                });

                if (!statusResp.ok) {
                  console.error("Status check error:", statusResp.status);
                  continue;
                }

                const status = await statusResp.json();
                console.log("Status:", status.status, "Logs:", status.logs);

                // Send progress
                if (status.status === "processing" || status.status === "starting") {
                  const progress = Math.min(95, 10 + (attempts * 2));
                  sendProgress(progress);
                }

                if (status.status === "succeeded") {
                  sendProgress(99);
                  const videoUrl = status.output;
                  if (videoUrl) {
                    sendVideo(videoUrl);
                    sendText(`\n\n✅ Vídeo generado exitosamente.`);
                  } else {
                    sendText("\n\n⚠️ Generación completada pero no se recibió URL del vídeo.");
                  }
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  return;
                }

                if (status.status === "failed" || status.status === "canceled") {
                  sendText(`\n\n❌ Error: ${status.error || "Generación fallida"}`);
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  return;
                }
              }

              sendText("\n\n⏱️ Tiempo de espera agotado. La generación puede continuar en segundo plano.");
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            } catch (err) {
              console.error("Replicate error:", err);
              sendText(`\n\nError al generar vídeo: ${err instanceof Error ? err.message : String(err)}`);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          }
        });

        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      } catch (error) {
        console.error("Video generation error:", error);
        return new Response(
          JSON.stringify({ error: error instanceof Error ? error.message : "Error generating video" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Prepare the API call based on whether it's image generation or regular chat
    const apiBody: any = {
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...messages,
      ],
      stream: true,
    };

    // Use appropriate model based on content type
    if (isImageGenerationRequest) {
      apiBody.model = "google/gemini-2.5-flash-image-preview";
      apiBody.modalities = ["image", "text"];
    } else if (hasVideoForAnalysis || hasImageContent) {
      // Use Gemini Pro for video/image analysis (better multimodal capabilities)
      apiBody.model = "google/gemini-2.5-pro";
    } else {
      apiBody.model = "google/gemini-2.5-flash";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
