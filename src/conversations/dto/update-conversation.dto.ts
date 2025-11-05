import { z } from 'zod';
import { createConversationDto } from './create-conversation.dto';

export const updateConversationDto = createConversationDto.partial();

export type UpdateConversationDto = z.infer<typeof updateConversationDto>;
