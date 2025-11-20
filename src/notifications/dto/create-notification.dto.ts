import { z } from 'zod'

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'userId é obrigatório'),
  fromUserId: z.string().min(1, 'fromUserId é obrigatório'),
  fromUsername: z.string().min(1, 'fromUsername é obrigatório'),
  fromUserAvatar: z.string().optional(),
  action: z.string().min(1, 'action é obrigatória'),
  category: z.enum(['MATCH', 'Equipes', 'Eventos', 'Comunidade']),
  thumbnail: z.string().optional(),
  relatedPostId: z.string().optional(),
  relatedCommentId: z.string().optional(),
})

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>

export const ListNotificationsQuerySchema = z.object({
  userId: z.string().min(1).optional().nullable(),
  category: z.preprocess(
    (val) => {
      // Se for undefined, null ou string vazia, retornar undefined
      if (val === undefined || val === null || val === '') {
        return undefined;
      }
      // Garantir que seja string
      const strVal = String(val);
      // Verificar se é um valor válido
      if (['MATCH', 'Equipes', 'Eventos', 'Comunidade'].includes(strVal)) {
        return strVal;
      }
      // Se não for válido, retornar undefined para não aplicar filtro
      return undefined;
    },
    z.enum(['MATCH', 'Equipes', 'Eventos', 'Comunidade']).optional()
  ),
  read: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return val === '' || val === null || val === undefined ? undefined : Boolean(val);
    },
    z.boolean().optional()
  ),
  limit: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 50;
      const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
      return isNaN(num) ? 50 : Math.min(Math.max(1, num), 100);
    },
    z.number().int().positive().max(100).default(50)
  ),
  offset: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      const num = typeof val === 'string' ? parseInt(val, 10) : Number(val);
      return isNaN(num) ? 0 : Math.max(0, num);
    },
    z.number().int().nonnegative().default(0)
  ),
}).passthrough() // Permite campos extras sem erro

// Tipo com campos opcionais para uso interno
export type ListNotificationsQuery = {
  userId?: string;
  category?: 'MATCH' | 'Equipes' | 'Eventos' | 'Comunidade';
  read?: boolean;
  limit?: number;
  offset?: number;
}

// Exportar schemas para validação
export const createNotificationDto = CreateNotificationSchema;
export const listNotificationsQuery = ListNotificationsQuerySchema;

