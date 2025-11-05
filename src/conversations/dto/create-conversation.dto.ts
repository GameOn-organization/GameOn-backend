import { z } from 'zod'

export const createConversationDto = z.object({
  participantes: z.array(z.string()).min(2, 'A conversa deve ter pelo menos 2 participantes'),
  lastMessage: z.object({
    text: z.string().min(1, 'A mensagem não pode estar vazia'),
    senderId: z.string().min(1, 'O Id de quem enviou a mensagem é obrigatório'),
    timestamp: z.coerce.date()
  }),
  createdAt: z.coerce.date().optional().default(() => new Date())
})

export type CreateConversationDto = z.infer<typeof createConversationDto>


