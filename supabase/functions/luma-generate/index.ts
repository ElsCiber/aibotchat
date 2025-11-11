import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, keyframe_image } = await req.json();
    const LUMA_API_KEY = Deno.env.get("LUMA_API_KEY");
    
    if (!LUMA_API_KEY) {
      throw new Error("LUMA_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("Starting video generation with prompt:", prompt);

    // Create generation
    const createBody: any = {
      prompt,
      model: "ray-2",
      resolution: "720p",
      duration: "5s"
    };

    // Add keyframe if image is provided
    if (keyframe_image) {
      createBody.keyframes = {
        frame0: {
          type: "image",
          url: keyframe_image
        }
      };
    }

    const createResponse = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LUMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createBody),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Luma API error:", createResponse.status, errorText);
      throw new Error(`Luma API error: ${createResponse.status} - ${errorText}`);
    }

    const generation = await createResponse.json();
    console.log("Generation created:", generation.id);

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 120; // 6 minutes max (120 * 3 seconds)
    let finalGeneration;

    while (!completed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;

      const statusResponse = await fetch(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generation.id}`,
        {
          headers: {
            "Authorization": `Bearer ${LUMA_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      finalGeneration = await statusResponse.json();
      console.log(`Status check ${attempts}:`, finalGeneration.state);

      if (finalGeneration.state === "completed") {
        completed = true;
      } else if (finalGeneration.state === "failed") {
        throw new Error(`Video generation failed: ${finalGeneration.failure_reason || "Unknown error"}`);
      }
    }

    if (!completed) {
      throw new Error("Video generation timed out");
    }

    const videoUrl = finalGeneration.assets?.video;
    
    if (!videoUrl) {
      throw new Error("No video URL in completed generation");
    }

    console.log("Video generation completed:", videoUrl);

    return new Response(
      JSON.stringify({ 
        video_url: videoUrl,
        generation_id: finalGeneration.id,
        prompt: finalGeneration.request?.prompt
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in luma-generate:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error generating video"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
