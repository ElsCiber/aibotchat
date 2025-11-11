import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, keyframe_image, ratio = "1280:768" } = await req.json();
    const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
    
    if (!RUNWAY_API_KEY) {
      console.error("RUNWAY_API_KEY is not configured in environment variables");
      throw new Error("RUNWAY_API_KEY is not configured. Please add your Runway API key in the secrets.");
    }
    
    console.log("RUNWAY_API_KEY found, length:", RUNWAY_API_KEY.length);

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const hasKeyframe = keyframe_image && typeof keyframe_image === "string" && keyframe_image.trim() !== "";
    const mode = hasKeyframe ? "image-to-video" : "text-to-video";
    console.log(`Starting ${mode} generation with prompt:`, prompt, "ratio:", ratio);

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache for existing video
    const cacheQuery = supabase
      .from("video_cache")
      .select("*")
      .eq("prompt", prompt);
    
    if (keyframe_image) {
      cacheQuery.eq("keyframe_image", keyframe_image);
    } else {
      cacheQuery.is("keyframe_image", null);
    }

    const { data: cachedVideo } = await cacheQuery.single();

    if (cachedVideo) {
      console.log("Found cached video:", cachedVideo.id);
      return new Response(
        JSON.stringify({ 
          video_url: cachedVideo.video_url,
          generation_id: cachedVideo.generation_id,
          prompt: prompt,
          cached: true
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    console.log("No cache found, generating new video...");

    // Create generation with Runway ML API
    let createResponse;
    const seed = Math.floor(Math.random() * 1000000);

    if (hasKeyframe) {
      // Image-to-video: use gen3a_turbo with /v1/image_to_video
      console.log("Using image-to-video endpoint with gen3a_turbo");
      const createBody = {
        promptText: prompt,
        promptImage: keyframe_image,
        model: "gen3a_turbo",
        duration: 5,
        ratio: ratio,
        seed: seed,
      };

      createResponse = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify(createBody),
      });
    } else {
      // Text-to-video: use gen3a with /v1/text_to_video
      console.log("Using text-to-video endpoint with gen3a");
      const createBody = {
        promptText: prompt,
        model: "gen3a",
        duration: 5,
        ratio: ratio,
        seed: seed,
      };

      createResponse = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06",
        },
        body: JSON.stringify(createBody),
      });
    }

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Runway API error:", createResponse.status, errorText);
      
      let errorMessage = `Runway API error: ${createResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = `Runway API error: ${errorJson.error}`;
          if (errorJson.issues) {
            errorMessage += ` - Issues: ${JSON.stringify(errorJson.issues)}`;
          }
        }
      } catch {
        // If not JSON, use text
        errorMessage += `: ${errorText}`;
      }
      
      if (createResponse.status === 403 || createResponse.status === 401) {
        errorMessage = "Authentication failed. Please verify your RUNWAY_API_KEY is correct and has the necessary permissions.";
      } else if (createResponse.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
      }
      
      throw new Error(errorMessage);
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
        `https://api.dev.runwayml.com/v1/tasks/${generation.id}`,
        {
          headers: {
            "Authorization": `Bearer ${RUNWAY_API_KEY}`,
            "X-Runway-Version": "2024-11-06",
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      finalGeneration = await statusResponse.json();
      console.log(`Status check ${attempts}:`, finalGeneration.status);

      if (finalGeneration.status === "SUCCEEDED") {
        completed = true;
      } else if (finalGeneration.status === "FAILED") {
        throw new Error(`Video generation failed: ${finalGeneration.failure || "Unknown error"}`);
      }
    }

    if (!completed) {
      throw new Error("Video generation timed out");
    }

    const videoUrl = finalGeneration.output?.[0];
    
    if (!videoUrl) {
      throw new Error("No video URL in completed generation");
    }

    console.log("Video generation completed:", videoUrl);

    // Cache the generated video
    const { error: cacheError } = await supabase
      .from("video_cache")
      .insert({
        prompt: prompt,
        keyframe_image: keyframe_image || null,
        video_url: videoUrl,
        generation_id: finalGeneration.id,
        model: hasKeyframe ? "gen3a_turbo" : "gen3a"
      });

    if (cacheError) {
      console.error("Failed to cache video:", cacheError);
      // Don't fail the request if caching fails
    } else {
      console.log("Video cached successfully");
    }

    return new Response(
      JSON.stringify({ 
        video_url: videoUrl,
        generation_id: finalGeneration.id,
        prompt: prompt,
        cached: false
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in runway-generate:", error);
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
