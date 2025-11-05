import { z } from 'zod'

export const createMessageDto = z.object({
  conversationId: z.string().min(1, 'O id da conversa é obrigatório'),
  senderId: z.string().min(1, 'o id de quem enviou a mensagem é obrigatório'),
  text: z.string().min(1, 'A mensagem não pode estar vazia'),
  timeStamp: z.coerce.date().optional().default(() => new Date()),
  read: z.boolean().optional().default(false)
})

export type CreateMessageDto = z.infer<typeof createMessageDto>

