import { z } from 'zod';

export const messageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(10000, "Message is too long (max 10,000 characters)"),
  role: z.enum(['user', 'assistant']),
  images: z.array(z.string().url()).max(10, "Maximum 10 images allowed").optional(),
  videos: z.array(z.string().url()).max(5, "Maximum 5 videos allowed").optional(),
});

export const conversationTitleSchema = z.string().trim().min(1).max(200, "Title is too long (max 200 characters)");

export type MessageInput = z.infer<typeof messageSchema>;
