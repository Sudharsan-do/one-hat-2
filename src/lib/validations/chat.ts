import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export const sanitizeInput = (input: string): string => {
  // Remove any HTML/script content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Don't allow any HTML tags
    ALLOWED_ATTR: [], // Don't allow any HTML attributes
  });

  // Additional custom sanitization
  return sanitized
    .trim()
    .replace(/[^\x20-\x7E]/g, '') // Only allow printable ASCII characters
    .slice(0, 4000); // Limit length
};

export const chatInputSchema = z.object({
  message: z.string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long")
    .transform(sanitizeInput),
  threadId: z.string().optional(),
});
