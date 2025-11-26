import { z } from 'zod'

export const CreateCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID é obrigatório'),
  content: z
    .string()
    .min(1, 'Conteúdo é obrigatório')
    .max(500, 'Comentário não deve passar de 500 caracteres')
})

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>

