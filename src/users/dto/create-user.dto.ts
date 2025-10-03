import { z } from 'zod';

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')
    .refine((phone) => {
      const ddd = phone.substring(1, 3);
      const validDDDs = [
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19', // SP
        '21',
        '22',
        '24', // RJ
        '27',
        '28', // ES
        '31',
        '32',
        '33',
        '34',
        '35',
        '37',
        '38', // MG
        '41',
        '42',
        '43',
        '44',
        '45',
        '46', // PR
        '47',
        '48',
        '49', // SC
        '51',
        '53',
        '54',
        '55', // RS
        '61', // DF
        '62',
        '64', // GO
        '63', // TO
        '65',
        '66', // MT
        '67', // MS
        '68', // AC
        '69', // RO
        '71',
        '73',
        '74',
        '75',
        '77', // BA
        '79', // SE
        '81',
        '87', // PE
        '82', // AL
        '83', // PB
        '84', // RN
        '85',
        '88', // CE
        '86',
        '89', // PI
        '91',
        '93',
        '94', // PA
        '92',
        '97', // AM
        '95', // RR
        '96', // AP
        '98',
        '99', // MA
      ];
      return validDDDs.includes(ddd);
    }, 'DDD inválido')
    .refine((phone) => {
      const number = phone.replace(/\D/g, '');
      return number.length === 10 || number.length === 11;
    }, 'Telefone deve ter 10 ou 11 dígitos')
    .optional(),
  image: z.any().nullable().optional(),
  tags: z.array(z.string().min(1)).default([]),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const ListUsersQuerySchema = z.object({
  // retorna quem tem pelo menos uma das tags informadas
  tagsAny: z
    .union([z.string().min(1), z.array(z.string().min(1)).nonempty()])
    .optional(),
  // retorna quem contém exatamente esta tag (equivalente a by-tag)
  tag: z.string().min(1).optional(),
  minAge: z.coerce.number().int().nonnegative().optional(),
  maxAge: z.coerce.number().int().nonnegative().optional(),
  name: z.string().min(1).optional(),
});

export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
