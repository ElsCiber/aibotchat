-- Clean up invalid data before adding constraints
DELETE FROM messages WHERE char_length(content) = 0 OR char_length(content) > 10000;

-- Make user_id NOT NULL in conversations table
ALTER TABLE conversations 
ALTER COLUMN user_id SET NOT NULL;

-- Add CHECK constraints for data validation
ALTER TABLE messages 
ADD CONSTRAINT check_content_length 
  CHECK (char_length(content) <= 10000 AND char_length(content) > 0);

ALTER TABLE messages 
ADD CONSTRAINT check_role 
  CHECK (role IN ('user', 'assistant'));

ALTER TABLE conversations 
ADD CONSTRAINT check_title_length 
  CHECK (char_length(title) <= 200 AND char_length(title) > 0);