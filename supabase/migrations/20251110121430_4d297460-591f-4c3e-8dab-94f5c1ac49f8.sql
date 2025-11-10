-- Drop folder_id column from conversations table
ALTER TABLE public.conversations DROP COLUMN IF EXISTS folder_id;

-- Drop folders table
DROP TABLE IF EXISTS public.folders;