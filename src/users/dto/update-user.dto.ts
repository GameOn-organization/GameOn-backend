import { z } from 'zod';
import { CreateUserSchema } from './create-user.dto';

// Schema de atualização estende o de criação, mas torna todos os campos opcionais
export const UpdateUserSchema = CreateUserSchema.partial();

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
