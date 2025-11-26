import { z } from 'zod'
import { CreateCommentSchema } from './create-comment.dto'

export const UpdateCommentSchema = CreateCommentSchema.partial().omit({ postId: true })

export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>

