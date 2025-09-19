import { z } from 'zod';

export const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().nonnegative().optional(),
  image: z.any().nullable().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
