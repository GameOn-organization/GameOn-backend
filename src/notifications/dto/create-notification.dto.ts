import { z } from 'zod'

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'userId é obrigatório'),
  fromUserId: z.string().min(1, 'fromUserId é obrigatório'),
  fromUsername: z.string().min(1, 'fromUsername é obrigatório'),
  fromUserAvatar: z.string().optional(),
  action: z.string().min(1, 'action é obrigatória'),
  category: z.enum(['MATCH!', 'Equipes', 'Eventos', 'Comunidade']),
  thumbnail: z.string().optional(),
  relatedPostId: z.string().optional(),
  relatedCommentId: z.string().optional(),
})

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>

export const ListNotificationsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  category: z.enum(['MATCH!', 'Equipes', 'Eventos', 'Comunidade']).optional(),
  read: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
})

export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>

// Exportar schemas para validação
export const createNotificationDto = CreateNotificationSchema;
export const listNotificationsQuery = ListNotificationsQuerySchema;

