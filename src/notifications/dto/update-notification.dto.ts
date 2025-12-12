import { z } from 'zod'

export const UpdateNotificationSchema = z.object({
  read: z.boolean().optional(),
})

export type UpdateNotificationDto = z.infer<typeof UpdateNotificationSchema>

// Exportar schema para validação
export const updateNotificationDto = UpdateNotificationSchema;

