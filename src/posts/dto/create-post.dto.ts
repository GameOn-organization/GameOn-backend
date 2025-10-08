import { z } from 'zod'

export const CreatePostSchema = z.object({
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(280, 'Post não deve passar de 280 caracteres')
})

export type CreatePostDto = z.infer<typeof CreatePostSchema>

export const ListPostsQuerySchema = z.object({
  authorId: z.string().min(1).optional(),
  minDate: z.coerce.date().optional(),
  maxDate: z.coerce.date().optional(),
  orderBy: z.enum(['createdAt', 'likes', 'comments']).default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>
