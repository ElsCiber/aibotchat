export type Message = { 
  role: "user" | "assistant"; 
  content: string | Array<{ 
    type: string; 
    text?: string; 
    image_url?: { url: string };
    video_url?: { url: string };
  }>;
  images?: string[];
  videos?: string[];
};

export async function streamChat({
  messages,
  mode = "roast",
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: Message[];
  mode?: "roast" | "formal" | "developer";
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/roast-chat`;

  try {
    // Transform messages to include images and videos if present
    const transformedMessages = messages.map(msg => {
      const hasImages = msg.images && msg.images.length > 0;
      const hasVideos = msg.videos && msg.videos.length > 0;
      
      if (hasImages || hasVideos) {
        const contentArray: Array<{ type: string; text?: string; image_url?: { url: string }; video_url?: { url: string } }> = [
          { type: "text", text: typeof msg.content === 'string' ? msg.content : msg.content.find((c: any) => c.type === 'text')?.text || '' }
        ];
        
        if (hasImages) {
          msg.images!.forEach(img => {
            contentArray.push({
              type: "image_url",
              image_url: { url: img }
            });
          });
        }
        
        if (hasVideos) {
          msg.videos!.forEach(video => {
            contentArray.push({
              type: "video_url",
              video_url: { url: video }
            });
          });
        }
        
        return {
          role: msg.role,
          content: contentArray
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: transformedMessages, mode }),
      signal,
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        onError("Whoa there, slow down! Even I need a breather between roasts. Try again in a minute.");
        return;
      }
      if (resp.status === 402) {
        onError("No hay créditos suficientes. Ve a Configuración → Espacio de trabajo → Uso para agregar créditos.");
        return;
      }
      throw new Error("Failed to start stream");
    }

    if (!resp.body) {
      throw new Error("No response body");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
          
          // Handle image generation responses - check both delta and message
          const deltaImages = parsed.choices?.[0]?.delta?.images;
          const messageImages = parsed.choices?.[0]?.message?.images;
          const images = deltaImages || messageImages;

          if (images && images.length > 0) {
            const imageUrls = images.map((img: any) => img.image_url?.url || img.url).filter(Boolean);
            if (imageUrls.length > 0) {
              onDelta(JSON.stringify({ images: imageUrls }));
            }
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore partial leftovers */ }
      }
    }

    onDone();
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      onError("Generación detenida");
    } else {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }
}
