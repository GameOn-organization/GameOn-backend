import { z } from 'zod';

export const CreateCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID é obrigatório'),
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(500, 'Comentário não deve passar de 500 caracteres'),
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(500, 'Comentário não deve passar de 500 caracteres'),
});

export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;

export const ListCommentsQuerySchema = z.object({
  postId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type ListCommentsQuery = z.infer<typeof ListCommentsQuerySchema>;
