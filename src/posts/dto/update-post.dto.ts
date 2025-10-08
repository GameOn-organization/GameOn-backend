import { z } from 'zod'
import { CreatePostSchema } from './create-post.dto'

export const UpdatePostSchema = CreatePostSchema.partial()

export type UpdatePostDto = z.infer<typeof UpdatePostSchema>
