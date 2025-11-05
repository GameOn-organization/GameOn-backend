import { z } from 'zod';
import { createMessageDto } from './create-message.dto';

export const updateMessageDto = createMessageDto.partial();

export type UpdateMessageDto = z.infer<typeof updateMessageDto>;
