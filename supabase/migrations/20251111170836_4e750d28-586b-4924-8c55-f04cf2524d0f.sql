-- Create table for video generation cache
CREATE TABLE public.video_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  keyframe_image TEXT,
  video_url TEXT NOT NULL,
  generation_id TEXT NOT NULL,
  model TEXT DEFAULT 'gen3a_turbo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.video_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can see cached videos)
CREATE POLICY "Anyone can view cached videos" 
ON public.video_cache 
FOR SELECT 
USING (true);

-- Create policy for service role to insert (edge functions can cache videos)
CREATE POLICY "Service role can insert cached videos" 
ON public.video_cache 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_video_cache_prompt ON public.video_cache(prompt);
CREATE INDEX idx_video_cache_prompt_keyframe ON public.video_cache(prompt, keyframe_image);