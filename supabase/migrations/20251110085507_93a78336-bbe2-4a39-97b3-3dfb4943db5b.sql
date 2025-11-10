-- Add mode column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'formal' CHECK (mode IN ('formal', 'developer'));