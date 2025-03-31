import z from "zod";

export const chatPostSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "system"]),
      content: z.string(),
    })
  ),
});
