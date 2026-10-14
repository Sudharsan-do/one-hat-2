import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  timestamp: z.date(),
});

export type Message = z.infer<typeof messageSchema>;

export const messageInputSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long")
    .transform(str => str.trim()),
});
