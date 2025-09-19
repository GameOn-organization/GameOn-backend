import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
  image: z.any().nullable().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const ListUsersQuerySchema = z.object({
  // retorna quem tem pelo menos uma das tags informadas
  tagsAny: z
    .union([
      z.string().min(1),
      z.array(z.string().min(1)).nonempty(),
    ])
    .optional(),
  // retorna quem contém exatamente esta tag (equivalente a by-tag)
  tag: z.string().min(1).optional(),
  minAge: z.coerce.number().int().nonnegative().optional(),
  maxAge: z.coerce.number().int().nonnegative().optional(),
  name: z.string().min(1).optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
